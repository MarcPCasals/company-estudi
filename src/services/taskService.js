import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore'
import {
  DEADLINE_CERTAINTY,
  DELIVERY_STATUS,
  TASK_ACTOR_ROLE,
  TASK_HISTORY_EVENT,
  TASK_STATUS,
  changeTaskDeliveryStatus,
  changeTaskProgress,
  createDeadline,
  createPersonalTaskRecord,
  createPrivateTaskDetails,
  createTaskFingerprint,
  createTaskHistoryEvent,
  transitionTaskStatus,
} from '../domain/dataModel.js'
import { db } from '../lib/firebase.js'

const requireFirestore = () => {
  if (!db) throw new Error('Firestore no està configurat en aquest entorn.')
  return db
}

const taskCollection = (classId, studentId) => collection(
  requireFirestore(),
  'classes', classId, 'students', studentId, 'tasks',
)

const taskReference = (classId, studentId, taskId) => doc(
  requireFirestore(),
  'classes', classId, 'students', studentId, 'tasks', taskId,
)

const historyReference = (classId, studentId, taskId) => doc(collection(
  taskReference(classId, studentId, taskId),
  'history',
))

const privateDetailsReference = (classId, studentId, taskId) => doc(
  taskReference(classId, studentId, taskId),
  'private', 'details',
)

const normalizeDeadlineInput = ({ certainty, at }) => {
  if (certainty !== DEADLINE_CERTAINTY.WITHOUT_DATE) {
    const date = new Date(at)
    if (!at || Number.isNaN(date.getTime())) {
      throw new Error('Aquest tipus de termini necessita una data i una hora vàlides.')
    }
    return createDeadline({ certainty, at: date.toISOString() })
  }
  return createDeadline({ certainty, at: null })
}

export const observeStudentTasks = ({ classId, studentId }, onData, onError) => onSnapshot(
  taskCollection(classId, studentId),
  { includeMetadataChanges: true },
  (snapshot) => onData(snapshot.docs
    .map((document) => ({ id: document.id, ...document.data() }))
    .sort((left, right) => {
      const leftDate = left.deadline?.at ?? '9999'
      const rightDate = right.deadline?.at ?? '9999'
      return leftDate.localeCompare(rightDate) || left.title.localeCompare(right.title, 'ca')
    }), {
      fromCache: snapshot.metadata.fromCache,
      hasPendingWrites: snapshot.docs.some((document) => document.metadata.hasPendingWrites),
    }),
  onError,
)

export const createStudentTask = async ({ classId, studentId, input }) => {
  const firestore = requireFirestore()
  const deadline = normalizeDeadlineInput(input.deadline)
  const taskRef = doc(taskCollection(classId, studentId))
  const task = createPersonalTaskRecord({
    classId,
    ownerStudentId: studentId,
    subjectId: input.subjectId,
    title: input.title,
    taskType: input.taskType,
    deadline,
    estimatedMinutes: input.estimatedMinutes,
    steps: input.steps,
    material: input.material,
    helpRequested: Boolean(input.helpRequested),
    requiresDelivery: Boolean(input.requiresDelivery),
    lifecycle: {
      status: input.needsClarification
        ? TASK_STATUS.NEEDS_CLARIFICATION
        : TASK_STATUS.PENDING,
    },
  })
  const now = new Date().toISOString()
  const createdEvent = createTaskHistoryEvent({
    classId,
    ownerStudentId: studentId,
    taskId: taskRef.id,
    eventType: TASK_HISTORY_EVENT.CREATED,
    actorRole: TASK_ACTOR_ROLE.STUDENT,
    actorId: studentId,
    to: task.status,
    happenedAt: now,
  })
  const batch = writeBatch(firestore)
  batch.set(taskRef, {
    ...task,
    fingerprint: createTaskFingerprint(task),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  batch.set(historyReference(classId, studentId, taskRef.id), createdEvent)
  batch.set(privateDetailsReference(classId, studentId, taskRef.id), {
    ...createPrivateTaskDetails({ privateNote: input.privateNote }),
    updatedAt: serverTimestamp(),
  })
  await batch.commit()
  return { id: taskRef.id, ...task }
}

const commitTaskChange = async ({ task, taskChanges, historyEvent }) => {
  const batch = writeBatch(requireFirestore())
  batch.update(taskReference(task.classId, task.ownerStudentId, task.id), {
    ...taskChanges,
    updatedAt: serverTimestamp(),
  })
  batch.set(historyReference(task.classId, task.ownerStudentId, task.id), historyEvent)
  await batch.commit()
}

export const updateStudentTaskStatus = async (task, toStatus, reason = '') => {
  const transition = transitionTaskStatus({
    classId: task.classId,
    ownerStudentId: task.ownerStudentId,
    taskId: task.id,
    fromStatus: task.status,
    toStatus,
    reason,
  })
  if (toStatus === TASK_STATUS.DONE) transition.taskChanges.progressPercent = 100
  if (task.status === TASK_STATUS.DONE && toStatus !== TASK_STATUS.DONE
    && task.deliveryStatus === DELIVERY_STATUS.DELIVERED) {
    transition.taskChanges.deliveryStatus = DELIVERY_STATUS.NOT_DELIVERED
  }
  await commitTaskChange({ task, ...transition })
}

export const updateStudentTaskProgress = async (task, progressPercent) => {
  const change = changeTaskProgress({
    classId: task.classId,
    ownerStudentId: task.ownerStudentId,
    taskId: task.id,
    fromProgressPercent: task.progressPercent,
    toProgressPercent: Number(progressPercent),
    currentStatus: task.status,
  })
  await commitTaskChange({ task, ...change })
}

export const updateStudentTaskDelivery = async (task, toDeliveryStatus) => {
  const change = changeTaskDeliveryStatus({
    classId: task.classId,
    ownerStudentId: task.ownerStudentId,
    taskId: task.id,
    taskStatus: task.status,
    fromDeliveryStatus: task.deliveryStatus,
    toDeliveryStatus,
  })
  await commitTaskChange({ task, ...change })
}

const validatePlan = ({ scheduledAt, durationMinutes }) => {
  const scheduledDate = new Date(scheduledAt)
  const duration = Number(durationMinutes)
  if (!scheduledAt || Number.isNaN(scheduledDate.getTime())) {
    throw new Error('Cal indicar una data i una hora per a la sessió.')
  }
  if (!Number.isInteger(duration) || duration < 10 || duration > 240) {
    throw new Error('La sessió ha de durar entre 10 i 240 minuts.')
  }
  return { scheduledAt: scheduledDate.toISOString(), durationMinutes: duration }
}

export const planStudentTask = async (task, plan) => {
  const normalizedPlan = validatePlan(plan)
  const firestore = requireFirestore()
  const isReschedule = Boolean(task.activeSessionId)
  const sessionRef = isReschedule
    ? doc(firestore, 'classes', task.classId, 'students', task.ownerStudentId, 'studySessions', task.activeSessionId)
    : doc(collection(firestore, 'classes', task.classId, 'students', task.ownerStudentId, 'studySessions'))
  const now = new Date().toISOString()
  const eventType = isReschedule
    ? TASK_HISTORY_EVENT.RESCHEDULED
    : TASK_HISTORY_EVENT.STATUS_CHANGED
  const historyEvent = createTaskHistoryEvent({
    classId: task.classId,
    ownerStudentId: task.ownerStudentId,
    taskId: task.id,
    eventType,
    actorRole: TASK_ACTOR_ROLE.STUDENT,
    actorId: task.ownerStudentId,
    from: isReschedule ? task.nextPlannedSessionAt : task.status,
    to: isReschedule ? normalizedPlan.scheduledAt : TASK_STATUS.PLANNED,
    reason: plan.reason,
    happenedAt: now,
  })
  const batch = writeBatch(firestore)
  batch.set(sessionRef, {
    classId: task.classId,
    ownerStudentId: task.ownerStudentId,
    taskId: task.id,
    scheduledAt: normalizedPlan.scheduledAt,
    durationMinutes: normalizedPlan.durationMinutes,
    state: 'planned',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true })
  batch.update(taskReference(task.classId, task.ownerStudentId, task.id), {
    activeSessionId: sessionRef.id,
    nextPlannedSessionAt: normalizedPlan.scheduledAt,
    plannedDurationMinutes: normalizedPlan.durationMinutes,
    status: TASK_STATUS.PLANNED,
    updatedAt: serverTimestamp(),
  })
  batch.set(historyReference(task.classId, task.ownerStudentId, task.id), historyEvent)
  await batch.commit()
}

export const updateStudentTaskDeadline = async (task, deadlineInput, reason = '') => {
  const deadline = normalizeDeadlineInput(deadlineInput)
  const historyEvent = createTaskHistoryEvent({
    classId: task.classId,
    ownerStudentId: task.ownerStudentId,
    taskId: task.id,
    eventType: TASK_HISTORY_EVENT.DEADLINE_CHANGED,
    actorRole: TASK_ACTOR_ROLE.STUDENT,
    actorId: task.ownerStudentId,
    from: task.deadline,
    to: deadline,
    reason,
  })
  await commitTaskChange({ task, taskChanges: { deadline }, historyEvent })
}

export const setStudentTaskHelpRequested = async (task, helpRequested) => {
  const historyEvent = createTaskHistoryEvent({
    classId: task.classId,
    ownerStudentId: task.ownerStudentId,
    taskId: task.id,
    eventType: TASK_HISTORY_EVENT.HELP_REQUESTED,
    actorRole: TASK_ACTOR_ROLE.STUDENT,
    actorId: task.ownerStudentId,
    from: task.helpRequested,
    to: helpRequested,
    reason: helpRequested ? 'L’alumne demana ajuda.' : 'L’alumne retira la petició d’ajuda.',
  })
  await commitTaskChange({ task, taskChanges: { helpRequested }, historyEvent })
}

export const loadPrivateTaskDetails = async (task) => {
  const snapshot = await getDoc(privateDetailsReference(task.classId, task.ownerStudentId, task.id))
  return snapshot.exists() ? snapshot.data() : createPrivateTaskDetails()
}

export const updatePrivateTaskDetails = async (task, privateNote) => setDoc(
  privateDetailsReference(task.classId, task.ownerStudentId, task.id),
  { ...createPrivateTaskDetails({ privateNote }), updatedAt: serverTimestamp() },
  { merge: true },
)
