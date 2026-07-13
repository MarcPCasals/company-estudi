const assertDocumentId = (value, label) => {
  if (typeof value !== 'string' || value.trim() === '' || value.includes('/')) {
    throw new Error(`${label} ha de ser un identificador de document vàlid.`)
  }
  return value.trim()
}

export const dataPaths = {
  classroom: (classId) => `classes/${assertDocumentId(classId, 'classId')}`,
  student: (classId, studentId) =>
    `${dataPaths.classroom(classId)}/students/${assertDocumentId(studentId, 'studentId')}`,
  subject: (classId, subjectId) =>
    `${dataPaths.classroom(classId)}/subjects/${assertDocumentId(subjectId, 'subjectId')}`,
  room: (classId, subjectId) =>
    `${dataPaths.classroom(classId)}/rooms/${assertDocumentId(subjectId, 'subjectId')}`,
  task: (classId, studentId, taskId) =>
    `${dataPaths.student(classId, studentId)}/tasks/${assertDocumentId(taskId, 'taskId')}`,
  taskHistory: (classId, studentId, taskId, historyId) =>
    `${dataPaths.task(classId, studentId, taskId)}/history/${assertDocumentId(historyId, 'historyId')}`,
  taskCandidate: (classId, candidateId) =>
    `${dataPaths.classroom(classId)}/taskCandidates/${assertDocumentId(candidateId, 'candidateId')}`,
  officialTask: (classId, officialTaskId) =>
    `${dataPaths.classroom(classId)}/officialTasks/${assertDocumentId(officialTaskId, 'officialTaskId')}`,
  studySession: (classId, studentId, sessionId) =>
    `${dataPaths.student(classId, studentId)}/studySessions/${assertDocumentId(sessionId, 'sessionId')}`,
  occupation: (classId, studentId, occupationId) =>
    `${dataPaths.student(classId, studentId)}/personalSchedule/${assertDocumentId(occupationId, 'occupationId')}`,
}

export const TASK_RECORD_KIND = Object.freeze({
  PERSONAL: 'personal_task',
  COMMUNITY_CANDIDATE: 'community_candidate',
  OFFICIAL: 'official_task',
})

export const TASK_TYPE = Object.freeze({
  HOMEWORK: 'homework',
  PROJECT: 'project',
  EXAM: 'exam',
})

export const TASK_STATUS = Object.freeze({
  NEEDS_CLARIFICATION: 'needs_clarification',
  PENDING: 'pending',
  PLANNED: 'planned',
  IN_PROGRESS: 'in_progress',
  DONE: 'done',
})

export const DELIVERY_STATUS = Object.freeze({
  NOT_REQUIRED: 'not_required',
  NOT_DELIVERED: 'not_delivered',
  DELIVERED: 'delivered',
})

export const TASK_HISTORY_EVENT = Object.freeze({
  CREATED: 'created',
  STATUS_CHANGED: 'status_changed',
  PROGRESS_UPDATED: 'progress_updated',
  RESCHEDULED: 'rescheduled',
  DEADLINE_CHANGED: 'deadline_changed',
  DELIVERY_CHANGED: 'delivery_changed',
  HELP_REQUESTED: 'help_requested',
})

export const TASK_ACTOR_ROLE = Object.freeze({
  STUDENT: 'student',
  TUTOR: 'tutor',
  SYSTEM: 'system',
})

const ALLOWED_STATUS_TRANSITIONS = Object.freeze({
  [TASK_STATUS.NEEDS_CLARIFICATION]: [TASK_STATUS.PENDING],
  [TASK_STATUS.PENDING]: [
    TASK_STATUS.NEEDS_CLARIFICATION,
    TASK_STATUS.PLANNED,
    TASK_STATUS.IN_PROGRESS,
    TASK_STATUS.DONE,
  ],
  [TASK_STATUS.PLANNED]: [
    TASK_STATUS.NEEDS_CLARIFICATION,
    TASK_STATUS.PENDING,
    TASK_STATUS.IN_PROGRESS,
    TASK_STATUS.DONE,
  ],
  [TASK_STATUS.IN_PROGRESS]: [
    TASK_STATUS.NEEDS_CLARIFICATION,
    TASK_STATUS.PENDING,
    TASK_STATUS.PLANNED,
    TASK_STATUS.DONE,
  ],
  [TASK_STATUS.DONE]: [
    TASK_STATUS.PENDING,
    TASK_STATUS.PLANNED,
    TASK_STATUS.IN_PROGRESS,
  ],
})

const assertEnumValue = (value, enumObject, label) => {
  if (!Object.values(enumObject).includes(value)) {
    throw new Error(`${label} no és vàlid.`)
  }
  return value
}

export const createTaskLifecycle = ({
  status = TASK_STATUS.PENDING,
  deliveryStatus = DELIVERY_STATUS.NOT_DELIVERED,
  progressPercent = 0,
} = {}) => {
  assertEnumValue(status, TASK_STATUS, 'L’estat de la tasca')
  assertEnumValue(deliveryStatus, DELIVERY_STATUS, 'L’estat de l’entrega')
  if (!Number.isInteger(progressPercent) || progressPercent < 0 || progressPercent > 100) {
    throw new Error('El progrés ha de ser un enter entre 0 i 100.')
  }
  if (deliveryStatus === DELIVERY_STATUS.DELIVERED && status !== TASK_STATUS.DONE) {
    throw new Error('Només es pot marcar com entregada una tasca feta.')
  }
  return { status, deliveryStatus, progressPercent }
}

const cleanTaskText = (value, label) => {
  const cleanValue = String(value ?? '').trim().replace(/\s+/g, ' ')
  if (cleanValue.length < 2 || cleanValue.length > 200) {
    throw new Error(`${label} ha de tenir entre 2 i 200 caràcters.`)
  }
  return cleanValue
}

const cleanOptionalTaskText = (value, label, maximumLength = 500) => {
  const cleanValue = String(value ?? '').trim().replace(/\s+/g, ' ')
  if (cleanValue.length > maximumLength) {
    throw new Error(`${label} no pot superar els ${maximumLength} caràcters.`)
  }
  return cleanValue
}

const normalizeEstimatedMinutes = (value) => {
  if (value === '' || value === null || value === undefined) return null
  const minutes = Number(value)
  if (!Number.isInteger(minutes) || minutes < 5 || minutes > 1200) {
    throw new Error('El temps estimat ha de ser un nombre enter entre 5 i 1.200 minuts.')
  }
  return minutes
}

const normalizeSteps = (steps = []) => {
  if (!Array.isArray(steps) || steps.length > 20) {
    throw new Error('Una tasca pot tenir com a màxim 20 passos.')
  }
  return steps
    .map((step) => cleanOptionalTaskText(step, 'Cada pas', 160))
    .filter(Boolean)
}

const taskBase = ({ classId, subjectId, title, deadline }) => ({
  classId: assertDocumentId(classId, 'classId'),
  subjectId: assertDocumentId(subjectId, 'subjectId'),
  title: cleanTaskText(title, 'El títol'),
  deadline,
})

export const createPersonalTaskRecord = ({
  classId,
  ownerStudentId,
  subjectId,
  title,
  taskType = TASK_TYPE.HOMEWORK,
  deadline = createDeadline(),
  estimatedMinutes = null,
  steps = [],
  material = '',
  helpRequested = false,
  requiresDelivery = true,
  lifecycle = createTaskLifecycle(),
}) => {
  assertEnumValue(taskType, TASK_TYPE, 'L’abast de la tasca')
  if (typeof helpRequested !== 'boolean' || typeof requiresDelivery !== 'boolean') {
    throw new Error('Les opcions de la tasca no són vàlides.')
  }
  const normalizedLifecycle = createTaskLifecycle({
    ...lifecycle,
    deliveryStatus: requiresDelivery
      ? (lifecycle.deliveryStatus ?? DELIVERY_STATUS.NOT_DELIVERED)
      : DELIVERY_STATUS.NOT_REQUIRED,
  })
  return {
    ...taskBase({ classId, subjectId, title, deadline }),
    recordKind: TASK_RECORD_KIND.PERSONAL,
    ownerStudentId: assertDocumentId(ownerStudentId, 'ownerStudentId'),
    taskType,
    estimatedMinutes: normalizeEstimatedMinutes(estimatedMinutes),
    steps: normalizeSteps(steps),
    material: cleanOptionalTaskText(material, 'El material'),
    helpRequested,
    requiresDelivery,
    officialTaskId: null,
    ...normalizedLifecycle,
  }
}

export const createPrivateTaskDetails = ({ privateNote = '' } = {}) => ({
  privateNote: cleanOptionalTaskText(privateNote, 'La nota privada', 1000),
})

const normalizeFingerprintText = (value) => String(value ?? '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('ca')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()

export const createTaskFingerprint = ({ subjectId, title, deadline }) => {
  const datePart = deadline?.at ? String(deadline.at).slice(0, 10) : deadline?.certainty ?? 'without_date'
  return `${assertDocumentId(subjectId, 'subjectId')}|${normalizeFingerprintText(title)}|${datePart}`
}

const tokenSimilarity = (left, right) => {
  const leftTokens = new Set(normalizeFingerprintText(left).split(' ').filter(Boolean))
  const rightTokens = new Set(normalizeFingerprintText(right).split(' ').filter(Boolean))
  if (leftTokens.size === 0 || rightTokens.size === 0) return 0
  const intersection = [...leftTokens].filter((token) => rightTokens.has(token)).length
  return intersection / new Set([...leftTokens, ...rightTokens]).size
}

export const findPotentialDuplicateTasks = (candidate, tasks = []) => tasks.filter((task) => {
  if (task.subjectId !== candidate.subjectId) return false
  if (task.status === TASK_STATUS.DONE && task.deliveryStatus === DELIVERY_STATUS.DELIVERED) return false
  const sameDate = (task.deadline?.at ?? null) === (candidate.deadline?.at ?? null)
    || (task.deadline?.at && candidate.deadline?.at
      && String(task.deadline.at).slice(0, 10) === String(candidate.deadline.at).slice(0, 10))
  const sameFingerprint = task.fingerprint
    && task.fingerprint === createTaskFingerprint(candidate)
  return sameFingerprint || (sameDate && tokenSimilarity(task.title, candidate.title) >= 0.6)
})

export const createCommunityTaskCandidateRecord = ({
  classId,
  subjectId,
  title,
  deadline = createDeadline(),
  fingerprint,
}) => ({
  ...taskBase({ classId, subjectId, title, deadline }),
  recordKind: TASK_RECORD_KIND.COMMUNITY_CANDIDATE,
  fingerprint: assertDocumentId(fingerprint, 'fingerprint'),
})

export const createOfficialTaskRecord = ({
  classId,
  subjectId,
  title,
  deadline = createDeadline(),
  confirmedByTutorId,
}) => ({
  ...taskBase({ classId, subjectId, title, deadline }),
  recordKind: TASK_RECORD_KIND.OFFICIAL,
  confirmedByTutorId: assertDocumentId(confirmedByTutorId, 'confirmedByTutorId'),
})

export const DEADLINE_CERTAINTY = Object.freeze({
  CONFIRMED: 'confirmed',
  TO_CONFIRM: 'to_confirm',
  WITHOUT_DATE: 'without_date',
})

export const createDeadline = ({
  certainty = DEADLINE_CERTAINTY.WITHOUT_DATE,
  at = null,
  timezone = 'Europe/Andorra',
} = {}) => {
  if (!Object.values(DEADLINE_CERTAINTY).includes(certainty)) {
    throw new Error('La certesa del termini no és vàlida.')
  }
  if (certainty === DEADLINE_CERTAINTY.WITHOUT_DATE && at !== null) {
    throw new Error('Un termini sense data no pot contenir una data.')
  }
  if (certainty !== DEADLINE_CERTAINTY.WITHOUT_DATE && !at) {
    throw new Error('Un termini confirmat o per confirmar necessita una data.')
  }

  return { certainty, at, timezone }
}

export const createTaskHistoryEvent = ({
  classId,
  ownerStudentId,
  taskId,
  eventType,
  actorRole,
  actorId,
  from = null,
  to = null,
  reason = '',
  happenedAt = new Date().toISOString(),
}) => {
  assertEnumValue(eventType, TASK_HISTORY_EVENT, 'El tipus d’esdeveniment')
  assertEnumValue(actorRole, TASK_ACTOR_ROLE, 'El rol de l’autor')
  const cleanReason = String(reason).trim().replace(/\s+/g, ' ')
  if (cleanReason.length > 300) throw new Error('El motiu no pot superar els 300 caràcters.')

  return {
    classId: assertDocumentId(classId, 'classId'),
    ownerStudentId: assertDocumentId(ownerStudentId, 'ownerStudentId'),
    taskId: assertDocumentId(taskId, 'taskId'),
    eventType,
    actorRole,
    actorId: assertDocumentId(actorId, 'actorId'),
    from,
    to,
    reason: cleanReason,
    happenedAt,
  }
}

export const transitionTaskStatus = ({
  classId,
  ownerStudentId,
  taskId,
  fromStatus,
  toStatus,
  actorRole = TASK_ACTOR_ROLE.STUDENT,
  actorId = ownerStudentId,
  reason = '',
  happenedAt = new Date().toISOString(),
}) => {
  assertEnumValue(fromStatus, TASK_STATUS, 'L’estat inicial')
  assertEnumValue(toStatus, TASK_STATUS, 'L’estat final')
  if (!ALLOWED_STATUS_TRANSITIONS[fromStatus].includes(toStatus)) {
    throw new Error(`No es pot passar de ${fromStatus} a ${toStatus}.`)
  }

  return {
    taskChanges: { status: toStatus, updatedAt: happenedAt },
    historyEvent: createTaskHistoryEvent({
      classId,
      ownerStudentId,
      taskId,
      eventType: TASK_HISTORY_EVENT.STATUS_CHANGED,
      actorRole,
      actorId,
      from: fromStatus,
      to: toStatus,
      reason,
      happenedAt,
    }),
  }
}

export const changeTaskDeliveryStatus = ({
  classId,
  ownerStudentId,
  taskId,
  taskStatus,
  fromDeliveryStatus,
  toDeliveryStatus,
  actorId = ownerStudentId,
  happenedAt = new Date().toISOString(),
}) => {
  createTaskLifecycle({ status: taskStatus, deliveryStatus: toDeliveryStatus })
  assertEnumValue(fromDeliveryStatus, DELIVERY_STATUS, 'L’estat inicial de l’entrega')

  return {
    taskChanges: { deliveryStatus: toDeliveryStatus, updatedAt: happenedAt },
    historyEvent: createTaskHistoryEvent({
      classId,
      ownerStudentId,
      taskId,
      eventType: TASK_HISTORY_EVENT.DELIVERY_CHANGED,
      actorRole: TASK_ACTOR_ROLE.STUDENT,
      actorId,
      from: fromDeliveryStatus,
      to: toDeliveryStatus,
      happenedAt,
    }),
  }
}

export const changeTaskProgress = ({
  classId,
  ownerStudentId,
  taskId,
  fromProgressPercent,
  toProgressPercent,
  currentStatus,
  actorId = ownerStudentId,
  happenedAt = new Date().toISOString(),
}) => {
  createTaskLifecycle({ status: currentStatus, progressPercent: fromProgressPercent })
  createTaskLifecycle({ status: currentStatus, progressPercent: toProgressPercent })
  const nextStatus = toProgressPercent > 0 && currentStatus !== TASK_STATUS.DONE
    ? TASK_STATUS.IN_PROGRESS
    : currentStatus
  return {
    taskChanges: {
      progressPercent: toProgressPercent,
      status: nextStatus,
      updatedAt: happenedAt,
    },
    historyEvent: createTaskHistoryEvent({
      classId,
      ownerStudentId,
      taskId,
      eventType: TASK_HISTORY_EVENT.PROGRESS_UPDATED,
      actorRole: TASK_ACTOR_ROLE.STUDENT,
      actorId,
      from: fromProgressPercent,
      to: toProgressPercent,
      happenedAt,
    }),
  }
}
