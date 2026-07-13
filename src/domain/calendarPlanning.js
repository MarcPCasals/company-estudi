import { WEEK_DAYS } from '../data/defaultSchedule.js'
import { TASK_STATUS } from './dataModel.js'

const DAY_ID_BY_JS_DAY = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
const WEEKDAY_END = '21:30'
const BETWEEN_ITEMS_BUFFER_MINUTES = 15
const END_OF_DAY_RESERVE_MINUTES = 30

const pad = (value) => String(value).padStart(2, '0')

export const localDateKey = (value) => {
  const date = value instanceof Date ? value : new Date(value)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export const combineLocalDateAndTime = (date, time) => {
  const [hours, minutes] = String(time).split(':').map(Number)
  const result = new Date(date)
  result.setHours(hours, minutes, 0, 0)
  return result
}

const addMinutes = (date, minutes) => new Date(date.getTime() + (minutes * 60_000))

const roundUpToQuarterHour = (date) => {
  const result = new Date(date)
  result.setSeconds(0, 0)
  const remainder = result.getMinutes() % 15
  if (remainder > 0) result.setMinutes(result.getMinutes() + (15 - remainder))
  return result
}

export const startOfWeek = (value = new Date()) => {
  const date = new Date(value)
  date.setHours(12, 0, 0, 0)
  const mondayOffset = (date.getDay() + 6) % 7
  date.setDate(date.getDate() - mondayOffset)
  return date
}

export const buildWeekDays = (referenceDate = new Date(), today = new Date()) => {
  const monday = startOfWeek(referenceDate)
  return WEEK_DAYS.map((day, index) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + index)
    return {
      ...day,
      date,
      dateKey: localDateKey(date),
      isToday: localDateKey(date) === localDateKey(today),
    }
  })
}

export const expandRecurringOccupations = (occupations, weekDays) => occupations.flatMap((occupation) => {
  const day = weekDays.find((item) => item.id === occupation.day)
  if (!day || !occupation.start || !occupation.end) return []
  return [{
    ...occupation,
    kind: 'occupation',
    dateKey: day.dateKey,
    startAt: combineLocalDateAndTime(day.date, occupation.start).toISOString(),
    endAt: combineLocalDateAndTime(day.date, occupation.end).toISOString(),
  }]
})

const intervalForSession = (session) => ({
  start: new Date(session.scheduledAt),
  end: addMinutes(new Date(session.scheduledAt), Number(session.durationMinutes)),
})

const intervalForOccupation = (occupation, day) => ({
  start: combineLocalDateAndTime(day.date, occupation.start),
  end: combineLocalDateAndTime(day.date, occupation.end),
})

const suggestedDuration = (task) => {
  const estimate = Number(task.estimatedMinutes) || 30
  return Math.min(60, Math.max(25, Math.round(estimate / 5) * 5))
}

const limitsForDay = ({ day, availability, schoolSchedule }) => {
  const isWeekend = day.id === 'saturday' || day.id === 'sunday'
  if (isWeekend) {
    if (availability?.weekend?.enabled !== true) return null
    return {
      start: availability.weekend.start,
      end: availability.weekend.end,
    }
  }
  return {
    start: availability?.availableAfterByDay?.[day.id]
      ?? schoolSchedule?.[day.id]?.schoolEndsAt
      ?? '17:00',
    end: WEEKDAY_END,
  }
}

export const suggestStudySlots = ({
  task,
  weekDays,
  availability,
  schoolSchedule,
  sessions = [],
  occupations = [],
  now = new Date(),
  maximumSuggestions = 3,
}) => {
  const durationMinutes = suggestedDuration(task)
  const deadline = task.deadline?.at ? new Date(task.deadline.at) : null
  const suggestions = []

  for (const day of weekDays) {
    if (suggestions.length >= maximumSuggestions) break
    const limits = limitsForDay({ day, availability, schoolSchedule })
    if (!limits) continue
    if (deadline && day.dateKey > localDateKey(deadline)) continue

    let dayStart = combineLocalDateAndTime(day.date, limits.start)
    let dayEnd = addMinutes(combineLocalDateAndTime(day.date, limits.end), -END_OF_DAY_RESERVE_MINUTES)
    if (deadline && day.dateKey === localDateKey(deadline) && deadline < dayEnd) dayEnd = deadline
    if (day.dateKey === localDateKey(now)) {
      dayStart = new Date(Math.max(dayStart.getTime(), roundUpToQuarterHour(addMinutes(now, 15)).getTime()))
    }
    if (dayEnd <= dayStart || day.dateKey < localDateKey(now)) continue

    const occupied = [
      ...occupations
        .filter((occupation) => occupation.day === day.id)
        .map((occupation) => intervalForOccupation(occupation, day)),
      ...sessions
        .filter((session) => session.id !== task.activeSessionId)
        .filter((session) => session.state === 'planned')
        .filter((session) => localDateKey(session.scheduledAt) === day.dateKey)
        .map(intervalForSession),
    ].sort((left, right) => left.start - right.start)

    let cursor = dayStart
    for (const interval of occupied) {
      if (interval.end <= cursor) continue
      if (addMinutes(cursor, durationMinutes) <= interval.start) break
      cursor = addMinutes(new Date(Math.max(cursor, interval.end)), BETWEEN_ITEMS_BUFFER_MINUTES)
    }
    const proposedEnd = addMinutes(cursor, durationMinutes)
    if (proposedEnd > dayEnd) continue

    suggestions.push({
      id: `${task.id}-${day.dateKey}-${cursor.getTime()}`,
      taskId: task.id,
      dateKey: day.dateKey,
      dayId: day.id,
      scheduledAt: cursor.toISOString(),
      durationMinutes,
      leavesFreeTime: true,
    })
  }
  return suggestions
}

export const deriveTodaySummary = ({ tasks = [], sessions = [], today = new Date() }) => {
  const todayKey = localDateKey(today)
  const openTasks = tasks.filter((task) => task.status !== TASK_STATUS.DONE)
  const todaySessions = sessions
    .filter((session) => localDateKey(session.scheduledAt) === todayKey && session.state === 'planned')
    .sort((left, right) => left.scheduledAt.localeCompare(right.scheduledAt))
  const upcomingSession = todaySessions.find((session) => new Date(session.scheduledAt) >= today)
  const overdueTask = openTasks.find((task) => task.deadline?.at && new Date(task.deadline.at) < today)
  const unclearTask = openTasks.find((task) => task.status === TASK_STATUS.NEEDS_CLARIFICATION)
  const taskToPlan = openTasks.find((task) => task.status === TASK_STATUS.PENDING && !task.activeSessionId)

  if (upcomingSession) return { kind: 'session', session: upcomingSession }
  if (overdueTask) return { kind: 'review', task: overdueTask }
  if (unclearTask) return { kind: 'clarify', task: unclearTask }
  if (taskToPlan) return { kind: 'plan', task: taskToPlan }
  return { kind: 'clear' }
}

export const dayIdForDate = (date) => DAY_ID_BY_JS_DAY[new Date(date).getDay()]
