import { localDateKey, startOfWeek } from './calendarPlanning.js'

export const SMART_MESSAGE_LEVEL = Object.freeze({
  SUGGESTION: 'suggestion',
  REMINDER: 'reminder',
  ALERT: 'alert',
  HELP: 'help',
})

const LEVEL_PRIORITY = Object.freeze({
  [SMART_MESSAGE_LEVEL.SUGGESTION]: 10,
  [SMART_MESSAGE_LEVEL.REMINDER]: 20,
  [SMART_MESSAGE_LEVEL.ALERT]: 30,
  [SMART_MESSAGE_LEVEL.HELP]: 40,
})

const asDate = (value) => {
  if (!value) return null
  if (typeof value.toDate === 'function') return value.toDate()
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const millis = (value) => asDate(value)?.getTime() ?? 0
const DAY = 86_400_000
const openTask = (task) => task.status !== 'done' && Number(task.progressPercent ?? 0) < 100
const plannedSession = (session) => session.state === 'planned'
const remainingMinutes = (task) => Math.max(0, Math.round(Number(task.estimatedMinutes ?? 0) * (100 - Number(task.progressPercent ?? 0)) / 100))
const daysUntil = (value, now) => {
  const target = asDate(value)
  if (!target) return Number.POSITIVE_INFINITY
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate())
  const currentDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((targetDay.getTime() - currentDay.getTime()) / DAY)
}
const actionableState = (state, now) => !state || (state.status === 'snoozed' && millis(state.until) <= now.getTime())

const message = ({ id, level, title, body, reason, action, secondaryAction = null, dismissible = true, dismissLabel = 'No m’ho tornis a mostrar', priority = 0 }) => ({
  id, level, title, body, reason, action, secondaryAction, dismissible, dismissLabel,
  priority: LEVEL_PRIORITY[level] + priority,
})

const hasCurrentWeekReview = (reviews, now) => {
  const weekKey = localDateKey(startOfWeek(now))
  return reviews.some((review) => review.id === weekKey || localDateKey(asDate(review.submittedAt) ?? new Date(0)) === weekKey)
}

export const resolveStudentSmartMessages = ({
  tasks = [], sessions = [], reviews = [], communityTasks = [], communityAlerts = [], messageStates = {}, now = new Date(), maximum = 2,
}) => {
  const current = asDate(now) ?? new Date()
  const open = tasks.filter(openTask)
  const upcomingSessions = sessions.filter(plannedSession).filter((session) => millis(session.scheduledAt) >= current.getTime())
  const results = []
  const add = (candidate) => {
    if (candidate && actionableState(messageStates[candidate.id], current)) results.push(candidate)
  }

  communityAlerts.filter((alert) => alert.status === 'active' && alert.type === 'contradiction').forEach((alert) => add(message({
    id: `community-alert:${alert.id}`,
    level: SMART_MESSAGE_LEVEL.ALERT,
    title: `Cal confirmar: ${alert.title}`,
    body: `Hi ha ${alert.variants?.length ?? 2} versions diferents. Comprova la data o el contingut abans d’afegir o planificar la tasca.`,
    reason: `Diversos alumnes han registrat informació diferent; el tutor ha publicat l’avís sense mostrar identitats.`,
    action: { label: 'Comprova-ho a la Comunitat', view: 'community' },
    secondaryAction: { label: 'Pregunta al tutor', view: 'messages' },
    priority: 9,
  })))

  communityTasks.filter((candidate) => candidate.status === 'confirmed' || candidate.recordKind === 'official_task').filter((candidate) => !tasks.some((task) => task.officialTaskId === candidate.id || (candidate.fingerprint && task.fingerprint === candidate.fingerprint))).forEach((candidate) => add(message({
    id: `community-task:${candidate.id}`,
    level: SMART_MESSAGE_LEVEL.REMINDER,
    title: `Possible tasca: ${candidate.title}`,
    body: 'El tutor ha confirmat aquesta proposta. Comprova si també et correspon abans d’afegir-la.',
    reason: 'Diversos alumnes havien apuntat una tasca semblant i el tutor n’ha revisat la informació.',
    action: { label: 'Comprova-la', view: 'community' },
    dismissible: true,
    dismissLabel: 'No és per a mi',
    priority: 4,
  })))

  if (current.getDay() === 0 && current.getHours() >= 18 && !hasCurrentWeekReview(reviews, current) && (open.length || sessions.length)) {
    add(message({ id: `weekly-review:${localDateKey(startOfWeek(current))}`, level: SMART_MESSAGE_LEVEL.REMINDER, title: 'Tanquem la setmana?', body: 'En dos minuts pots revisar què ha funcionat i preparar la següent setmana.', reason: 'És diumenge al vespre i la revisió setmanal encara no està feta.', action: { label: 'Fes la revisió', view: 'review' }, secondaryAction: { label: 'Aquesta setmana no', status: 'dismissed' } }))
  }

  const exams = open.filter((task) => task.taskType === 'exam' && task.deadline?.at)
  exams.forEach((task) => {
    const days = daysUntil(task.deadline.at, current)
    const remaining = remainingMinutes(task)
    if (days === 7 && !task.activeSessionId) add(message({ id: `exam-plan:${task.id}:7`, level: SMART_MESSAGE_LEVEL.REMINDER, title: `Preparem ${task.title}?`, body: 'Defineix què has de repassar i reparteix-ho en passos abans que sigui urgent.', reason: 'L’examen és d’aquí a set dies i encara no té preparació planificada.', action: { label: 'Divideix i planifica', view: 'tasks', taskId: task.id }, priority: 2 }))
    if (days === 3 && remaining > 0) add(message({ id: `exam-short:${task.id}:3`, level: SMART_MESSAGE_LEVEL.REMINDER, title: 'Una sessió curta pot ajudar-te a començar', body: 'Pots preparar una Sala curta de 25 minuts o buscar una altra franja.', reason: `Queden tres dies per a ${task.title} i encara hi ha preparació pendent.`, action: { label: 'Prepara 25 minuts', view: 'study', taskId: task.id }, secondaryAction: { label: 'Busca una altra franja', view: 'calendar' }, priority: 3 }))
    if (days === 2 && remaining >= 60) add(message({ id: `exam-normal:${task.id}:2`, level: SMART_MESSAGE_LEVEL.ALERT, title: 'Encara queda una part important per preparar', body: 'Revisa si avui et convé una sessió de 75 minuts o dues sessions curtes.', reason: `L’examen és d’aquí a dos dies i queden aproximadament ${remaining} minuts de preparació.`, action: { label: 'Prepara la sessió', view: 'study', taskId: task.id }, secondaryAction: { label: 'Divideix-la', view: 'tasks' }, priority: 3 }))
    if (days === 1 && remaining > 0) add(message({ id: `exam-review:${task.id}:1`, level: SMART_MESSAGE_LEVEL.ALERT, title: 'Prioritza un repàs essencial', body: 'Revisa els dubtes i prepara el material; no cal intentar recuperar-ho tot ara.', reason: `${task.title} és demà.`, action: { label: 'Revisa els dubtes', view: 'tasks', taskId: task.id }, priority: 4 }))
  })

  const unplanned = open.filter((task) => !task.activeSessionId)
  const weeklyPlanningMoment = (current.getDay() === 0 && current.getHours() >= 18) || (current.getDay() === 1 && current.getHours() < 12)
  if (weeklyPlanningMoment && unplanned.length >= 2 && upcomingSessions.length === 0) add(message({ id: `week-unplanned:${localDateKey(startOfWeek(current))}`, level: SMART_MESSAGE_LEVEL.REMINDER, title: 'La setmana encara no té moments de treball', body: `Tens ${unplanned.length} tasques sense franja. Piu et pot proposar un pla que hauràs de confirmar.`, reason: 'Hi ha diverses tasques obertes i cap sessió futura planificada.', action: { label: 'Planifica en 2 minuts', view: 'calendar', intent: 'weekly-planner' }, priority: 1 }))

  const missed = sessions.find((session) => plannedSession(session) && millis(session.scheduledAt) < current.getTime() - Math.max(15, Number(session.durationMinutes ?? 30)) * 60_000)
  if (missed) add(message({ id: `missed-session:${missed.id}`, level: SMART_MESSAGE_LEVEL.REMINDER, title: 'No has pogut fer aquesta sessió?', body: 'La podem reprogramar sense cap penalització.', reason: 'L’hora prevista ja ha passat i la sessió continua pendent.', action: { label: 'Reprograma', view: 'calendar', sessionId: missed.id }, secondaryAction: { label: 'Revisa la tasca', view: 'tasks', taskId: missed.taskId }, priority: 5 }))

  open.filter((task) => task.deadline?.at).forEach((task) => {
    const days = daysUntil(task.deadline.at, current)
    const remaining = remainingMinutes(task)
    if (days >= 0 && days <= 2 && Number(task.progressPercent ?? 0) === 0) add(message({ id: `urgent-not-started:${task.id}:${localDateKey(current)}`, level: SMART_MESSAGE_LEVEL.ALERT, title: `${task.title} encara no està començada`, body: 'Una sessió curta avui pot reduir la pressió de demà.', reason: `El termini és ${days === 0 ? 'avui' : days === 1 ? 'demà' : 'd’aquí a dos dies'} i el progrés és del 0%.`, action: { label: 'Prepara una Sala curta', view: 'study', taskId: task.id }, secondaryAction: { label: 'Busca una franja', view: 'calendar' }, priority: 6 }))
    const plannedBeforeDeadline = upcomingSessions.filter((session) => session.taskId === task.id && millis(session.scheduledAt) <= millis(task.deadline.at)).reduce((total, session) => total + Number(session.durationMinutes ?? 0), 0)
    if (remaining >= 30 && days >= 0 && remaining > plannedBeforeDeadline && task.activeSessionId) add(message({ id: `insufficient-plan:${task.id}:${localDateKey(current)}`, level: SMART_MESSAGE_LEVEL.HELP, title: 'El temps planificat pot no ser suficient', body: 'Pots reorganitzar, simplificar els passos o demanar ajuda.', reason: `Queden uns ${remaining} minuts i només n’hi ha ${plannedBeforeDeadline} planificats abans del termini.`, action: { label: 'Reorganitza', view: 'calendar', taskId: task.id }, secondaryAction: { label: 'Demana ajuda', view: 'tasks', taskId: task.id }, dismissible: false, priority: 8 }))
  })

  const next = upcomingSessions.sort((left, right) => millis(left.scheduledAt) - millis(right.scheduledAt))[0]
  if (next) {
    const minutesUntil = Math.round((millis(next.scheduledAt) - current.getTime()) / 60_000)
    const task = tasks.find((item) => item.id === next.taskId)
    if (minutesUntil >= 15 && minutesUntil <= 30 && task?.material) add(message({ id: `prepare-material:${next.id}`, level: SMART_MESSAGE_LEVEL.SUGGESTION, title: 'Vols preparar el material?', body: task.material, reason: `La sessió comença d’aquí a ${minutesUntil} minuts.`, action: { label: 'Revisa la tasca', view: 'tasks', taskId: task.id }, priority: 1 }))
  }

  open.filter((task) => Number(task.estimatedMinutes ?? 0) >= 90 && !(task.steps?.length)).forEach((task) => add(message({ id: `split-large-task:${task.id}`, level: SMART_MESSAGE_LEVEL.SUGGESTION, title: 'Aquesta tasca serà més fàcil si la divideixes', body: 'Defineix dos o tres passos petits abans de reservar-ne el temps.', reason: `La durada estimada és de ${task.estimatedMinutes} minuts i encara no té passos.`, action: { label: 'Divideix-la', view: 'tasks', taskId: task.id } })))

  return results.sort((left, right) => right.priority - left.priority || left.id.localeCompare(right.id)).slice(0, Math.max(0, maximum))
}

export const normalizeSmartMessageState = ({ status, until = null }) => {
  if (!['snoozed', 'dismissed', 'accepted', 'resolved'].includes(status)) throw new Error('L’estat del missatge no és vàlid.')
  if (status === 'snoozed') {
    const date = asDate(until)
    if (!date || date.getTime() <= Date.now()) throw new Error('Cal indicar fins quan s’ajorna el missatge.')
    return { status, until: date.toISOString() }
  }
  return { status, until: null }
}
