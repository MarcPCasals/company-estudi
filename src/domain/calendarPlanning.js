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

const minutesFromTime = (value) => {
  const [hours, minutes] = String(value ?? '').split(':').map(Number)
  return Number.isInteger(hours) && Number.isInteger(minutes) ? (hours * 60) + minutes : null
}

export const isStudentFreeTimeNow = ({ availability, sessions = [], occupations = [], now = new Date() }) => {
  const current = now instanceof Date ? now : new Date(now)
  if (!availability || Number.isNaN(current.getTime())) return false
  const dayId = DAY_ID_BY_JS_DAY[current.getDay()]
  const isWeekend = dayId === 'saturday' || dayId === 'sunday'
  const window = isWeekend
    ? (availability.weekend?.enabled ? availability.weekend : null)
    : { start: availability.availableAfterByDay?.[dayId], end: WEEKDAY_END }
  const startMinutes = minutesFromTime(window?.start)
  const endMinutes = minutesFromTime(window?.end)
  const currentMinutes = (current.getHours() * 60) + current.getMinutes()
  if (startMinutes === null || endMinutes === null || currentMinutes < startMinutes || currentMinutes >= endMinutes) return false

  const insideOccupation = occupations.some((occupation) => occupation.day === dayId
    && currentMinutes >= minutesFromTime(occupation.start)
    && currentMinutes < minutesFromTime(occupation.end))
  if (insideOccupation) return false

  const insideStudySession = sessions.some((session) => {
    if (session.state !== 'planned') return false
    const start = new Date(session.scheduledAt)
    if (Number.isNaN(start.getTime()) || localDateKey(start) !== localDateKey(current)) return false
    const end = addMinutes(start, Number(session.durationMinutes) || 0)
    return current >= start && current < end
  })
  return !insideStudySession
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

export const suggestedDuration = (task) => {
  const estimate = Number(task.estimatedMinutes) || 30
  return Math.min(60, Math.max(25, Math.round(estimate / 5) * 5))
}

export const limitsForDay = ({ day, availability, schoolSchedule }) => {
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

export const validateStudySlot = ({ task = {}, scheduledAt, durationMinutes, availability, schoolSchedule, sessions = [], occupations = [], ignoreSessionId = null }) => {
  const start = new Date(scheduledAt)
  const duration = Number(durationMinutes)
  if (Number.isNaN(start.getTime()) || !Number.isInteger(duration) || duration < 10 || duration > 240) {
    return { valid: false, reason: 'Indica una data, una hora i una durada vàlides.' }
  }
  const day = buildWeekDays(start).find((item) => item.dateKey === localDateKey(start))
  const limits = day && limitsForDay({ day, availability, schoolSchedule })
  if (!limits) return { valid: false, reason: 'Aquest dia està reservat com a temps lliure.' }
  const allowedStart = combineLocalDateAndTime(start, limits.start)
  const allowedEnd = addMinutes(combineLocalDateAndTime(start, limits.end), -END_OF_DAY_RESERVE_MINUTES)
  const end = addMinutes(start, duration)
  if (start < allowedStart) return { valid: false, reason: `La disponibilitat comença a les ${limits.start}, després de l’escola, el trajecte i el descans.` }
  if (end > allowedEnd) return { valid: false, reason: 'La sessió acabaria massa tard o eliminaria el marge lliure del final del dia.' }
  const deadline = task.deadline?.at ? new Date(task.deadline.at) : null
  if (deadline && end > deadline) return { valid: false, reason: 'La sessió acabaria després del termini de la tasca.' }
  const occupationConflict = occupations.filter((item) => item.day === day.id).map((item) => intervalForOccupation(item, day)).find((item) => start < item.end && end > item.start)
  const sessionConflict = sessions.filter((item) => item.state === 'planned' && item.id !== task.activeSessionId && item.id !== ignoreSessionId && localDateKey(item.scheduledAt) === day.dateKey).map(intervalForSession).find((item) => start < addMinutes(item.end, BETWEEN_ITEMS_BUFFER_MINUTES) && end > addMinutes(item.start, -BETWEEN_ITEMS_BUFFER_MINUTES))
  if (occupationConflict || sessionConflict) return { valid: false, reason: 'La franja se solapa amb una ocupació o una altra sessió, inclòs el marge necessari.' }
  return { valid: true, reason: 'Franja disponible: respecta ocupacions, descansos i el marge lliure.' }
}

export const calculateDayCapacity = ({ day, availability, schoolSchedule, occupations = [], sessions = [] }) => {
  const limits = limitsForDay({ day, availability, schoolSchedule })
  if (!limits) return { availableMinutes: 0, plannedMinutes: 0, overloaded: false }
  const start = combineLocalDateAndTime(day.date, limits.start)
  const end = addMinutes(combineLocalDateAndTime(day.date, limits.end), -END_OF_DAY_RESERVE_MINUTES)
  const blockedMinutes = occupations.filter((item) => item.day === day.id).reduce((total, item) => {
    const itemStart = Math.max(start.getTime(), combineLocalDateAndTime(day.date, item.start).getTime())
    const itemEnd = Math.min(end.getTime(), combineLocalDateAndTime(day.date, item.end).getTime())
    return total + Math.max(0, (itemEnd - itemStart) / 60_000)
  }, 0)
  const availableMinutes = Math.max(0, Math.round((end - start) / 60_000) - blockedMinutes)
  const plannedMinutes = sessions.filter((item) => item.state === 'planned' && localDateKey(item.scheduledAt) === day.dateKey).reduce((total, item) => total + Number(item.durationMinutes || 0), 0)
  return { availableMinutes, plannedMinutes, overloaded: plannedMinutes > availableMinutes }
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

const taskPriority = (task) => {
  const deadline = task.deadline?.at ? new Date(task.deadline.at).getTime() : Number.MAX_SAFE_INTEGER
  const uncertainty = task.deadline?.certainty === 'to_confirm' || !task.deadline?.at ? -1 : 0
  const importance = task.taskType === 'exam' ? -2 : task.taskType === 'project' ? -1 : 0
  return [deadline, importance, uncertainty]
}

export const suggestWeeklyPlans = ({ tasks = [], weekDays, availability, schoolSchedule, sessions = [], occupations = [], now = new Date() }) => {
  const pending = tasks.filter((task) => {
    if (task.status === TASK_STATUS.DONE) return false
    if (!task.activeSessionId) return true
    const active = sessions.find((session) => session.id === task.activeSessionId)
    return active?.state === 'planned' && new Date(active.scheduledAt) < now
  })
    .sort((left, right) => {
      const leftPriority = taskPriority(left)
      const rightPriority = taskPriority(right)
      for (let index = 0; index < leftPriority.length; index += 1) {
        if (leftPriority[index] !== rightPriority[index]) return leftPriority[index] - rightPriority[index]
      }
      return String(left.title).localeCompare(String(right.title), 'ca')
    })
  if (!pending.length) return { alternatives: [], unscheduled: [], capacityMinutes: 0 }

  const build = (reverse = false) => {
    const proposedSessions = []
    const unscheduled = []
    for (const task of pending) {
      let remaining = Math.max(10, Number(task.estimatedMinutes) || 30)
      const chunks = []
      while (remaining > 0) { chunks.push(Math.min(60, remaining)); remaining -= chunks[chunks.length - 1] }
      for (const [chunkIndex, chunk] of chunks.entries()) {
        const days = reverse ? [...weekDays].reverse() : weekDays
        const slots = suggestStudySlots({ task: { ...task, estimatedMinutes: chunk }, weekDays: days, availability, schoolSchedule, sessions: [...sessions, ...proposedSessions], occupations, now, maximumSuggestions: 3 })
        const slot = slots[chunkIndex % Math.max(1, slots.length)] ?? slots[0]
        if (!slot) { unscheduled.push({ task, minutes: chunk }); continue }
        proposedSessions.push({ ...slot, id: `${slot.id}-${chunkIndex}`, state: 'planned', task, stepLabel: task.steps?.[chunkIndex] ?? null, reason: `${task.steps?.[chunkIndex] ? `${task.steps[chunkIndex]} · ` : ''}${task.deadline?.at ? 'abans del termini' : 'sense termini confirmat'} · disponibilitat real · marge de descans conservat.` })
      }
    }
    return { sessions: proposedSessions, unscheduled }
  }
  const early = build(false)
  const balanced = build(true)
  const alternatives = [
    { id: 'early', name: 'Avançar feina', description: 'Prioritza les primeres franges còmodes.', ...early },
    { id: 'balanced', name: 'Repartir la càrrega', description: 'Distribueix els blocs cap al final de la setmana disponible.', ...balanced },
  ].filter((plan, index, all) => index === 0 || JSON.stringify(plan.sessions.map((item) => item.scheduledAt)) !== JSON.stringify(all[0].sessions.map((item) => item.scheduledAt)))
  return { alternatives, unscheduled: early.unscheduled, capacityMinutes: early.sessions.reduce((total, item) => total + item.durationMinutes, 0) }
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

export const findDailyReviewTask = ({ tasks = [], sessions = [], now = new Date() }) => {
  const tasksById = Object.fromEntries(tasks.map((task) => [task.id, task]))
  return sessions
    .filter((session) => session.state === 'planned' && localDateKey(session.scheduledAt) === localDateKey(now))
    .filter((session) => new Date(session.scheduledAt).getTime() + (Number(session.durationMinutes) * 60_000) <= new Date(now).getTime())
    .map((session) => tasksById[session.taskId])
    .find((task) => task && task.status !== TASK_STATUS.DONE) ?? null
}

export const dayIdForDate = (date) => DAY_ID_BY_JS_DAY[new Date(date).getDay()]
