export const POST_TYPES = Object.freeze(['question', 'notice', 'resource'])

const clean = (value, label, maximum = 1000) => {
  const text = String(value ?? '').trim().replace(/\s+/g, ' ')
  if (text.length < 2 || text.length > maximum) throw new Error(`${label} ha de tenir entre 2 i ${maximum} caràcters.`)
  return text
}

export const normalizeCommunityPost = ({ type, title, body, authorRole }) => {
  if (!POST_TYPES.includes(type)) throw new Error('El tipus de publicació no és vàlid.')
  if (authorRole === 'student' && type === 'notice') throw new Error('Els avisos de sala els publica el tutor.')
  return { type, title: clean(title, 'El títol', 140), body: clean(body, 'El contingut') }
}

export const normalizeReply = (body) => ({ body: clean(body, 'La resposta') })

export const detectCommonTasks = ({ students = [], tasksByStudent = {}, ratio = 0.5, minimumStudents = 5 }) => {
  const activeIds = new Set(students.filter((student) => student.active !== false).map((student) => student.id))
  const requiredCount = Math.max(minimumStudents, Math.ceil(activeIds.size * ratio))
  if (activeIds.size < minimumStudents) return []
  const groups = new Map()
  activeIds.forEach((studentId) => (tasksByStudent[studentId] ?? []).forEach((task) => {
    if (!task.fingerprint || task.status === 'done') return
    const group = groups.get(task.fingerprint) ?? { fingerprint: task.fingerprint, subjectId: task.subjectId, title: task.title, deadline: task.deadline, matchingStudents: new Set() }
    group.matchingStudents.add(studentId)
    groups.set(task.fingerprint, group)
  }))
  return [...groups.values()].filter((group) => group.matchingStudents.size >= requiredCount).map(({ matchingStudents, ...group }) => ({ ...group, count: matchingStudents.size, requiredCount, classSize: activeIds.size }))
}

export const normalizeNotificationSettings = ({ mode, quietStart, quietEnd }) => {
  if (!['instant', 'daily_summary', 'disabled'].includes(mode)) throw new Error('El mode de notificacions no és vàlid.')
  const pattern = /^([01]\d|2[0-3]):[0-5]\d$/
  if (!pattern.test(quietStart) || !pattern.test(quietEnd)) throw new Error('Les hores de silenci no són vàlides.')
  return { mode, quietStart, quietEnd }
}
