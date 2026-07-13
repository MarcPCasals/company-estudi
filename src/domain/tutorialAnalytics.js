import { localDateKey } from './calendarPlanning.js'
import { TASK_STATUS } from './dataModel.js'

export const TUTORIAL_COMPETENCIES = Object.freeze([
  'Anticipació', 'Descomposició', 'Planificació realista',
  'Gestió del temps', 'Regulació', 'Demanar ajuda',
])

export const PROGRESS_STAGES = Object.freeze([
  { id: 'starting', label: 'Comença a provar l’estratègia' },
  { id: 'with_support', label: 'La fa amb suport' },
  { id: 'mostly_autonomous', label: 'La fa sovint amb autonomia' },
  { id: 'autonomous', label: 'La integra amb autonomia' },
])

const clean = (value, label, maximum = 500) => {
  const text = String(value ?? '').trim().replace(/\s+/g, ' ')
  if (text.length < 2 || text.length > maximum) throw new Error(`${label} ha de tenir entre 2 i ${maximum} caràcters.`)
  return text
}

export const normalizeWeeklyReview = (input) => ({
  workedWell: clean(input.workedWell, 'El que ha funcionat'),
  wasDifficult: clean(input.wasDifficult, 'La dificultat'),
  nextAdjustment: clean(input.nextAdjustment, 'El reajustament'),
  helpNeeded: Boolean(input.helpNeeded),
})

export const normalizeTutorialGoal = (input) => {
  if (!TUTORIAL_COMPETENCIES.includes(input.competency)) throw new Error('La competència tutorial no és vàlida.')
  if (!PROGRESS_STAGES.some((stage) => stage.id === input.progressStage)) throw new Error('L’etapa de progrés no és vàlida.')
  return {
    competency: input.competency,
    progressStage: input.progressStage,
    description: clean(input.description, 'L’objectiu'),
  }
}

export const normalizeTutorFeedback = (input) => ({
  observation: clean(input.observation, 'L’observació'),
  question: clean(input.question, 'La pregunta'),
  strategy: clean(input.strategy, 'L’estratègia'),
  agreement: clean(input.agreement, 'L’acord'),
})

export const buildSupportiveNotice = (input) => ({
  title: clean(input.title, 'El títol', 100),
  message: `Hem observat: ${clean(input.observation, 'L’observació', 300)} Et proposem: ${clean(input.suggestedAction, 'La proposta', 300)}${String(input.support ?? '').trim() ? ` Si ho necessites: ${clean(input.support, 'El suport', 300)}` : ''}`,
})

export const buildStudentInsights = ({ tasks = [], sessions = [] }) => {
  const open = tasks.filter((task) => task.status !== TASK_STATUS.DONE)
  const planned = open.filter((task) => task.activeSessionId).length
  const partial = open.filter((task) => Number(task.progressPercent) > 0).length
  const help = open.filter((task) => task.helpRequested).length
  const plannedSessions = sessions.filter((session) => session.state === 'planned').length
  return [
    { id: 'planning', label: 'Planificació', interpretation: open.length ? `${planned} de ${open.length} tasques obertes tenen una sessió.` : 'Encara no hi ha tasques obertes.', evidence: `${plannedSessions} sessions futures registrades.` },
    { id: 'progress', label: 'Posada en marxa', interpretation: `${partial} tasques obertes tenen avanç parcial.`, evidence: 'L’avanç prové dels registres que fa l’alumne.' },
    { id: 'help', label: 'Demanar ajuda', interpretation: help ? `${help} peticions d’ajuda actives.` : 'No hi ha peticions d’ajuda actives.', evidence: 'Només compta peticions explícites, no inferències.' },
  ]
}

export const buildClassExceptions = ({ students = [], tasksByStudent = {}, now = new Date() }) => students.flatMap((student) => {
  const tasks = tasksByStudent[student.id] ?? []
  const open = tasks.filter((task) => task.status !== TASK_STATUS.DONE)
  const exceptions = []
  const help = open.filter((task) => task.helpRequested)
  const unclear = open.filter((task) => task.status === TASK_STATUS.NEEDS_CLARIFICATION)
  const overdue = open.filter((task) => task.deadline?.at && new Date(task.deadline.at) < now)
  if (help.length) exceptions.push({ studentId: student.id, studentName: student.displayName, type: 'help', label: `${help.length} peticions d’ajuda` })
  if (unclear.length) exceptions.push({ studentId: student.id, studentName: student.displayName, type: 'clarify', label: `${unclear.length} tasques per aclarir` })
  if (overdue.length) exceptions.push({ studentId: student.id, studentName: student.displayName, type: 'review', label: `${overdue.length} terminis passats per revisar` })
  return exceptions
})

export const buildClassLoad = ({ tasksByStudent = {}, sessionsByStudent = {}, from = new Date(), days = 7 }) => {
  const result = {}
  for (let offset = 0; offset < days; offset += 1) {
    const date = new Date(from); date.setDate(date.getDate() + offset)
    result[localDateKey(date)] = { dateKey: localDateKey(date), deadlines: 0, sessions: 0 }
  }
  Object.values(tasksByStudent).flat().forEach((task) => {
    const key = task.deadline?.at && localDateKey(task.deadline.at)
    if (result[key]) result[key].deadlines += 1
  })
  Object.values(sessionsByStudent).flat().filter((session) => session.state === 'planned').forEach((session) => {
    const key = localDateKey(session.scheduledAt)
    if (result[key]) result[key].sessions += 1
  })
  return Object.values(result)
}
