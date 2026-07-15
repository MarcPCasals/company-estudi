import { EXCLUDED_PIU_STATES, getPiuAsset } from '../data/piuAssets.js'

export const PIU_SURFACE = Object.freeze({
  HOME: 'home',
  TASKS: 'tasks',
  PLANNING: 'planning',
  WORK: 'work',
  PROGRESS: 'progress',
  COMMUNITY: 'community',
  TUTOR: 'tutor',
})

export const PIU_EVENT = Object.freeze({
  TASK_SAVED: 'task_saved',
  TASK_COMPLETED: 'task_completed',
  IMPORTANT_TASK_COMPLETED: 'important_task_completed',
  PLAN_SAVED: 'plan_saved',
  WEEKLY_REVIEW: 'weekly_review',
  CONTRIBUTION_SHARED: 'contribution_shared',
  ERROR_RESOLVED: 'error_resolved',
  START_WORK: 'start_work',
  FIRST_CONSISTENCY: 'first_consistency',
  LONG_CONSISTENCY: 'long_consistency',
})

const RULES = Object.freeze({
  base: { priority: 0, minimumDurationMs: 0, cooldownMs: 0, message: 'Què vols avançar?', returnState: null },
  neutral: { priority: 10, minimumDurationMs: 0, cooldownMs: 0, message: 'Tot tranquil. Què vols avançar?', returnState: null },
  ready: { priority: 20, minimumDurationMs: 0, cooldownMs: 0, message: 'Quan vulguis, comencem.', returnState: null },
  ready_excited: { priority: 20, minimumDurationMs: 0, cooldownMs: 0, message: 'Quan vulguis, ho tenim preparat.', returnState: null },
  greeting_normal: { priority: 30, minimumDurationMs: 4_000, cooldownMs: 0, message: 'Ja tornem a ser aquí.', returnState: 'neutral' },
  greeting_happy: { priority: 30, minimumDurationMs: 6_000, cooldownMs: 86_400_000, message: 'Bon dia! Mirem quin és el següent pas?', returnState: 'neutral' },
  thinking: { priority: 40, minimumDurationMs: 700, cooldownMs: 0, message: 'Mirem com encaixa millor.', returnState: null },
  imaginative: { priority: 40, minimumDurationMs: 700, cooldownMs: 0, message: 'Podem provar una altra manera.', returnState: null },
  starting_work: { priority: 55, minimumDurationMs: 5_000, cooldownMs: 0, message: 'Preparem només el que necessitem.', returnState: 'focused_work' },
  focused_work: { priority: 40, minimumDurationMs: 0, cooldownMs: 0, message: 'Un pas cada vegada.', returnState: null },
  enjoying_study: { priority: 40, minimumDurationMs: 0, cooldownMs: 0, message: 'Bon ritme, sense córrer.', returnState: null },
  satisfied: { priority: 60, minimumDurationMs: 3_000, cooldownMs: 20_000, message: 'Perfecte, ja ho tenim.', returnState: 'neutral' },
  happy: { priority: 65, minimumDurationMs: 5_000, cooldownMs: 60_000, message: 'Un pas menys. Bona feina.', returnState: 'neutral' },
  very_happy: { priority: 70, minimumDurationMs: 6_000, cooldownMs: 300_000, message: 'Això sí que era un bon tros de feina.', returnState: 'neutral' },
  proud: { priority: 75, minimumDurationMs: 8_000, cooldownMs: 0, message: 'Has mirat el procés, no només el resultat.', returnState: 'neutral' },
  celebrate: { priority: 80, minimumDurationMs: 8_000, cooldownMs: 600_000, message: 'Aquesta fita mereix celebrar-la.', returnState: 'very_happy' },
  first_consistency: { priority: 75, minimumDurationMs: 8_000, cooldownMs: 0, message: 'Comença a notar-se la constància.', returnState: 'neutral' },
  long_consistency: { priority: 80, minimumDurationMs: 8_000, cooldownMs: 0, message: 'Has trobat una manera de mantenir el ritme.', returnState: 'neutral' },
  concerned: { priority: 100, minimumDurationMs: 3_000, cooldownMs: 0, message: 'Hi ha una cosa per revisar, però no hem perdut la feina.', returnState: null },
  tired: { priority: 90, minimumDurationMs: 30_000, cooldownMs: 5_400_000, message: 'Fa estona que hi som. Vols descansar una mica?', returnState: 'resting' },
  resting: { priority: 90, minimumDurationMs: 0, cooldownMs: 0, message: 'Descansar també forma part del pla.', returnState: null },
  free_time_music: { priority: 25, minimumDurationMs: 0, cooldownMs: 0, message: 'Ara tens temps lliure. Gaudeix-ne sense presses.', returnState: null },
  free_time_rubik: { priority: 25, minimumDurationMs: 0, cooldownMs: 0, message: 'Una estona per desconnectar també forma part del dia.', returnState: null },
  sleeping: { priority: 15, minimumDurationMs: 0, cooldownMs: 0, message: 'Per avui ja està bé. Demà hi tornem.', returnState: null },
})

const EVENT_STATE = Object.freeze({
  [PIU_EVENT.TASK_SAVED]: 'satisfied',
  [PIU_EVENT.TASK_COMPLETED]: 'happy',
  [PIU_EVENT.IMPORTANT_TASK_COMPLETED]: 'very_happy',
  [PIU_EVENT.PLAN_SAVED]: 'satisfied',
  [PIU_EVENT.WEEKLY_REVIEW]: 'proud',
  [PIU_EVENT.CONTRIBUTION_SHARED]: 'happy',
  [PIU_EVENT.ERROR_RESOLVED]: 'satisfied',
  [PIU_EVENT.START_WORK]: 'starting_work',
  [PIU_EVENT.FIRST_CONSISTENCY]: 'first_consistency',
  [PIU_EVENT.LONG_CONSISTENCY]: 'long_consistency',
})

const freeTimeStateFor = (variantSeed, localTime) => {
  const date = localTime instanceof Date ? localTime : new Date(localTime ?? Date.now())
  const daySeed = `${variantSeed ?? 'piu'}:${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
  const parity = [...daySeed].reduce((total, character) => total + character.charCodeAt(0), 0) % 2
  return parity === 0 ? 'free_time_music' : 'free_time_rubik'
}

const stateForContext = ({ surface, activity, firstEntryToday, returningToday, hasUpcomingAction, localTime, variantSeed }) => {
  if (activity === 'accepted_break') return 'resting'
  if (activity === 'free_time') return freeTimeStateFor(variantSeed, localTime)
  if (activity === 'planning' || activity === 'editing_task') return 'thinking'
  if (activity === 'exploring_options' || activity === 'dividing_task') return 'imaginative'
  if (activity === 'working') return 'focused_work'
  if ([PIU_SURFACE.HOME, PIU_SURFACE.TUTOR].includes(surface) && firstEntryToday) return 'greeting_happy'
  if ([PIU_SURFACE.HOME, PIU_SURFACE.TUTOR].includes(surface) && returningToday) return 'greeting_normal'
  if (surface === PIU_SURFACE.HOME && hasUpcomingAction) return 'ready_excited'
  const date = localTime instanceof Date ? localTime : new Date(localTime ?? Date.now())
  const night = date.getHours() > 22 || (date.getHours() === 22 && date.getMinutes() >= 30)
  if (surface === PIU_SURFACE.HOME && night) return 'sleeping'
  if ([PIU_SURFACE.TASKS, PIU_SURFACE.PLANNING].includes(surface)) return 'ready'
  return 'neutral'
}

const responseFor = (state) => ({ state, ...getPiuAsset(state), ...RULES[state] })

export const resolvePiuVisualState = ({
  surface = PIU_SURFACE.HOME,
  activity = null,
  event = null,
  online = true,
  hasError = false,
  hasPendingWrites = false,
  activeMinutes = 0,
  firstEntryToday = false,
  returningToday = false,
  hasUpcomingAction = false,
  localTime = new Date(),
  variantSeed = null,
  previousState = null,
  previousShownAt = 0,
  lastShownAt = {},
  now = Date.now(),
} = {}) => {
  let state = stateForContext({ surface, activity, firstEntryToday, returningToday, hasUpcomingAction, localTime, variantSeed })
  if (event && EVENT_STATE[event]) state = EVENT_STATE[event]
  if (Number(activeMinutes) >= 50) state = 'tired'
  if (activity === 'accepted_break') state = 'resting'
  if (hasError || !online || hasPendingWrites) state = 'concerned'

  if (EXCLUDED_PIU_STATES.includes(state) || !RULES[state]) state = 'base'
  const candidate = responseFor(state)
  const lastShown = Number(lastShownAt[state]) || 0
  if (candidate.cooldownMs && lastShown && now - lastShown < candidate.cooldownMs) {
    state = stateForContext({ surface, activity, firstEntryToday: false, returningToday: false, hasUpcomingAction, localTime, variantSeed })
  }

  if (previousState && RULES[previousState]) {
    const previous = responseFor(previousState)
    const elapsed = now - (Number(previousShownAt) || 0)
    const mustFinish = elapsed < previous.minimumDurationMs && previous.priority >= responseFor(state).priority
    if (mustFinish) return previous
  }
  return responseFor(state)
}

export const isPiuStateAllowed = (state) => Boolean(RULES[state]) && !EXCLUDED_PIU_STATES.includes(state)
