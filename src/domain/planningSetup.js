import { DEFAULT_SCHOOL_SCHEDULE, WEEK_DAYS } from '../data/defaultSchedule.js'
import { DEFAULT_SUBJECT_COLORS } from '../data/subjects.js'

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/
const DAY_IDS = new Set(WEEK_DAYS.map((day) => day.id))
const OCCUPATION_TYPES = new Set(['extracurricular', 'meal', 'other'])
const COLOR_PATTERN = /^#[0-9a-f]{6}$/i

const assertMinutes = (value, label) => {
  const minutes = Number(value)
  if (!Number.isInteger(minutes) || minutes < 0 || minutes > 180) {
    throw new Error(`${label} ha de ser un nombre entre 0 i 180 minuts.`)
  }
  return minutes
}

const assertTime = (value, label) => {
  if (!TIME_PATTERN.test(String(value))) throw new Error(`${label} no és una hora vàlida.`)
  return value
}

export const addMinutesToTime = (time, minutes) => {
  if (time === null) return null
  assertTime(time, 'L’hora')
  const [hours, minutePart] = time.split(':').map(Number)
  const total = Math.min((hours * 60) + minutePart + minutes, (23 * 60) + 59)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

export const normalizePlanningSetup = ({
  travelMinutes = 0,
  restMinutes = 30,
  weekendEnabled = true,
  weekendStart = '10:00',
  weekendEnd = '18:00',
  activities = [],
  subjectColors = DEFAULT_SUBJECT_COLORS,
  schoolSchedule = DEFAULT_SCHOOL_SCHEDULE,
}) => {
  const cleanTravelMinutes = assertMinutes(travelMinutes, 'El trajecte')
  const cleanRestMinutes = assertMinutes(restMinutes, 'El descans')
  if (activities.length > 10) throw new Error('Es poden afegir com a màxim 10 ocupacions recurrents.')

  const cleanActivities = activities.map((activity, index) => {
    const day = String(activity.day)
    const start = assertTime(activity.start, 'L’hora d’inici')
    const end = assertTime(activity.end, 'L’hora final')
    const label = String(activity.label ?? '').trim().replace(/\s+/g, ' ')
    const type = String(activity.type ?? 'other')
    if (!DAY_IDS.has(day)) throw new Error('El dia de l’ocupació no és vàlid.')
    if (start >= end) throw new Error('L’ocupació ha d’acabar després de començar.')
    if (label.length < 2 || label.length > 80) {
      throw new Error('El nom de l’ocupació ha de tenir entre 2 i 80 caràcters.')
    }
    if (!OCCUPATION_TYPES.has(type)) throw new Error('El tipus d’ocupació no és vàlid.')
    return { id: `activity-${index}`, day, start, end, label, type }
  })

  const availableAfterByDay = Object.fromEntries(
    WEEK_DAYS.slice(0, 5).map(({ id }) => [
      id,
      addMinutesToTime(
        schoolSchedule[id]?.schoolEndsAt ?? DEFAULT_SCHOOL_SCHEDULE[id].schoolEndsAt,
        cleanTravelMinutes + cleanRestMinutes,
      ),
    ]),
  )
  const weekend = weekendEnabled
    ? {
        enabled: true,
        start: assertTime(weekendStart, 'L’inici del cap de setmana'),
        end: assertTime(weekendEnd, 'El final del cap de setmana'),
      }
    : { enabled: false, start: null, end: null }
  if (weekend.enabled && weekend.start >= weekend.end) {
    throw new Error('La disponibilitat del cap de setmana no és coherent.')
  }
  const routineEvents = WEEK_DAYS.slice(0, 5).flatMap(({ id }) => {
    const schoolEndsAt = schoolSchedule[id]?.schoolEndsAt
      ?? DEFAULT_SCHOOL_SCHEDULE[id].schoolEndsAt
    const travelEnd = addMinutesToTime(schoolEndsAt, cleanTravelMinutes)
    const restEnd = addMinutesToTime(travelEnd, cleanRestMinutes)
    const events = []
    if (cleanTravelMinutes > 0) {
      events.push({ id: `travel-${id}`, day: id, start: schoolEndsAt, end: travelEnd, label: 'Trajecte', type: 'travel' })
    }
    if (cleanRestMinutes > 0) {
      events.push({ id: `rest-${id}`, day: id, start: travelEnd, end: restEnd, label: 'Descans', type: 'rest' })
    }
    return events
  })
  const personalEvents = [...routineEvents, ...cleanActivities]
  const cleanSubjectColors = Object.fromEntries(Object.entries(DEFAULT_SUBJECT_COLORS).map(
    ([subjectId, fallback]) => {
      const candidate = String(subjectColors?.[subjectId] ?? fallback)
      return [subjectId, COLOR_PATTERN.test(candidate) ? candidate.toLowerCase() : fallback]
    },
  ))

  return {
    privateSettings: {
      travelMinutes: cleanTravelMinutes,
      restMinutes: cleanRestMinutes,
      weekend,
      activities: cleanActivities,
      subjectColors: cleanSubjectColors,
    },
    personalEvents,
    availabilitySummary: {
      availableAfterByDay,
      weekend,
      blockedSlots: personalEvents.map(({ day, start, end }) => ({ day, start, end })),
    },
  }
}
