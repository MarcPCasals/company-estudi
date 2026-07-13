export const GAMIFICATION_ACTION = Object.freeze({
  PLANNED: 'planned',
  DIVIDED: 'divided',
  EARLY_START: 'early_start',
  READJUSTED: 'readjusted',
  HELP_REQUESTED: 'help_requested',
  WEEKLY_REVIEW: 'weekly_review',
})

export const GAMIFICATION_ACTIONS = Object.freeze({
  [GAMIFICATION_ACTION.PLANNED]: { label: 'Planificar una tasca', xp: 10, weeklyLimit: 3, repeat: 'once' },
  [GAMIFICATION_ACTION.DIVIDED]: { label: 'Dividir-la en passos', xp: 10, weeklyLimit: 3, repeat: 'once' },
  [GAMIFICATION_ACTION.EARLY_START]: { label: 'Començar amb temps', xp: 12, weeklyLimit: 3, repeat: 'once' },
  [GAMIFICATION_ACTION.READJUSTED]: { label: 'Reajustar un pla', xp: 8, weeklyLimit: 2, repeat: 'weekly' },
  [GAMIFICATION_ACTION.HELP_REQUESTED]: { label: 'Demanar ajuda', xp: 8, weeklyLimit: 2, repeat: 'once' },
  [GAMIFICATION_ACTION.WEEKLY_REVIEW]: { label: 'Revisar la setmana', xp: 12, weeklyLimit: 1, repeat: 'weekly' },
})

export const GAMIFICATION_LEVELS = Object.freeze([
  { level: 1, name: 'Primer pas', minimumXp: 0, nestStage: 'Un lloc per començar' },
  { level: 2, name: 'Niu preparat', minimumXp: 40, nestStage: 'Piu ja té el niu preparat' },
  { level: 3, name: 'Branca florida', minimumXp: 100, nestStage: 'Hi apareix una branca amb fulles' },
  { level: 4, name: 'Racó d’estudi', minimumXp: 180, nestStage: 'El niu incorpora un petit racó d’estudi' },
  { level: 5, name: 'Company constant', minimumXp: 300, nestStage: 'El racó de Piu està complet' },
])

export const PIU_ACCESSORIES = Object.freeze([
  { id: 'none', label: 'Sense complement', requiredLevel: 1 },
  { id: 'agenda', label: 'Agenda verda', requiredLevel: 2 },
  { id: 'motxilla', label: 'Motxilla', requiredLevel: 3 },
  { id: 'manta', label: 'Manta de descans', requiredLevel: 4 },
])

export const WEEKLY_MISSIONS = Object.freeze([
  { id: 'prepare', title: 'Prepara el camí', description: 'Planifica una tasca que tinguis pendent.', action: GAMIFICATION_ACTION.PLANNED },
  { id: 'small-steps', title: 'Pas a pas', description: 'Divideix una tasca en dos passos o més.', action: GAMIFICATION_ACTION.DIVIDED },
  { id: 'look-back', title: 'Mira enrere per avançar', description: 'Fes la revisió setmanal breu.', action: GAMIFICATION_ACTION.WEEKLY_REVIEW },
])

export const DEFAULT_GAMIFICATION_PREFERENCES = Object.freeze({
  mode: 'full',
  animationsEnabled: true,
  accessory: 'none',
})

const toDate = (value) => value?.toDate?.() ?? (value ? new Date(value) : null)

export const getWeekKey = (value = new Date()) => {
  const date = new Date(value)
  date.setHours(12, 0, 0, 0)
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7))
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10)
}

export const createGamificationEventId = ({ action, sourceId, weekKey = getWeekKey() }) => {
  const rule = GAMIFICATION_ACTIONS[action]
  if (!rule) throw new Error('L’acció de gamificació no és vàlida.')
  const cleanSource = String(sourceId ?? '').trim().replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 120)
  if (!cleanSource) throw new Error('L’acció necessita un origen identificable.')
  return rule.repeat === 'weekly' ? `${action}--${weekKey}--${cleanSource}` : `${action}--${cleanSource}`
}

export const canAwardGamificationAction = ({ events = [], action, sourceId, now = new Date() }) => {
  const rule = GAMIFICATION_ACTIONS[action]
  if (!rule) return { allowed: false, reason: 'unknown_action' }
  const weekKey = getWeekKey(now)
  const eventId = createGamificationEventId({ action, sourceId, weekKey })
  if (events.some((event) => event.id === eventId)) return { allowed: false, reason: 'already_awarded', eventId, weekKey }
  const weeklyCount = events.filter((event) => event.action === action && event.weekKey === weekKey).length
  if (weeklyCount >= rule.weeklyLimit) return { allowed: false, reason: 'weekly_limit', eventId, weekKey }
  return { allowed: true, eventId, weekKey, xp: rule.xp }
}

export const getGamificationLevel = (xp = 0) => {
  const safeXp = Math.max(0, Number(xp) || 0)
  const current = [...GAMIFICATION_LEVELS].reverse().find((item) => safeXp >= item.minimumXp) ?? GAMIFICATION_LEVELS[0]
  const next = GAMIFICATION_LEVELS.find((item) => item.level === current.level + 1) ?? null
  return {
    ...current,
    next,
    xpIntoLevel: safeXp - current.minimumXp,
    xpForNextLevel: next ? next.minimumXp - current.minimumXp : 0,
    progressPercent: next ? Math.round(((safeXp - current.minimumXp) / (next.minimumXp - current.minimumXp)) * 100) : 100,
  }
}

export const buildGamificationSummary = ({ events = [], now = new Date() }) => {
  const totalXp = events.reduce((total, event) => total + (Number(event.xp) || 0), 0)
  const weekKey = getWeekKey(now)
  const weeklyEvents = events.filter((event) => event.weekKey === weekKey)
  const weeklyActions = new Set(weeklyEvents.map((event) => event.action))
  const consistencySteps = Math.min(3, weeklyActions.size)
  const level = getGamificationLevel(totalXp)
  return {
    totalXp,
    weekKey,
    weeklyEvents,
    weeklyActions,
    consistencySteps,
    consistencyComplete: consistencySteps === 3,
    level,
    missions: WEEKLY_MISSIONS.map((mission) => ({
      ...mission,
      completed: weeklyActions.has(mission.action),
    })),
    latestEvent: [...events].sort((left, right) => (toDate(right.createdAt)?.getTime() ?? 0) - (toDate(left.createdAt)?.getTime() ?? 0))[0] ?? null,
  }
}

export const getPiuStateForSummary = (summary) => {
  if (!summary?.latestEvent) return 'base'
  if ([GAMIFICATION_ACTION.PLANNED, GAMIFICATION_ACTION.DIVIDED, GAMIFICATION_ACTION.READJUSTED].includes(summary.latestEvent.action)) return 'planifica'
  if (summary.latestEvent.action === GAMIFICATION_ACTION.EARLY_START) return 'estudia'
  return summary.consistencyComplete ? 'celebra' : 'content'
}

export const isEarlyStart = ({ deadlineAt, now = new Date(), minimumHours = 24 }) => {
  if (!deadlineAt) return false
  const deadline = new Date(deadlineAt)
  return !Number.isNaN(deadline.getTime()) && deadline.getTime() - new Date(now).getTime() >= minimumHours * 60 * 60 * 1000
}
