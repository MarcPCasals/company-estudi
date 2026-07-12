import { DEFAULT_SCHOOL_SCHEDULE, WEEK_DAYS } from '../data/defaultSchedule.js'

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/
const DAY_IDS = new Set(WEEK_DAYS.map((day) => day.id))

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
    if (!DAY_IDS.has(day)) throw new Error('El dia de l’ocupació no és vàlid.')
    if (start >= end) throw new Error('L’ocupació ha d’acabar després de començar.')
    if (label.length < 2 || label.length > 80) {
      throw new Error('El nom de l’ocupació ha de tenir entre 2 i 80 caràcters.')
    }
    return { id: `activity-${index}`, day, start, end, label }
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

  return {
    privateSettings: {
      travelMinutes: cleanTravelMinutes,
      restMinutes: cleanRestMinutes,
      weekend,
      activities: cleanActivities,
    },
    personalEvents: cleanActivities,
    availabilitySummary: {
      availableAfterByDay,
      weekend,
      blockedSlots: cleanActivities.map(({ day, start, end }) => ({ day, start, end })),
    },
  }
}
