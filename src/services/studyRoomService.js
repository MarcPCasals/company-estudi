import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'
import {
  STUDY_ROOM_SESSION_STATUS,
  buildStudyRoomLeaderboard,
  createStudyRoomSessionSnapshot,
  getStudyRoomXpDecision,
  normalizeStudyRoomSessionSnapshot,
} from '../domain/studyRoom.js'
import { db } from '../lib/firebase.js'
import { observeWithPermissionRetry } from './firestoreObserver.js'

const requireDb = () => {
  if (!db) throw new Error('Firestore no està configurat.')
  return db
}

const studentPath = (classId, studentId) => ['classes', classId, 'students', studentId]

const localDayKey = (value = new Date()) => {
  const date = new Date(value)
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10)
}

const cleanId = (value) => String(value ?? '').trim().replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 120)
const ACTIVE_SESSION_DOCUMENT = 'current'
const LOCAL_SESSION_PREFIX = 'company-estudi:study-room-session'

const localSessionKey = ({ classId, studentId }) => `${LOCAL_SESSION_PREFIX}:${cleanId(classId)}:${cleanId(studentId)}`

export const getStudyRoomBlockEventId = (sessionId, blockNumber) => `${cleanId(sessionId)}--${blockNumber}`

export const loadLocalStudyRoomSession = ({ classId, studentId }, storage = globalThis.localStorage) => {
  try {
    return normalizeStudyRoomSessionSnapshot(JSON.parse(storage?.getItem(localSessionKey({ classId, studentId })) ?? 'null'))
  } catch {
    return null
  }
}

export const saveLocalStudyRoomSession = ({ classId, studentId, snapshot }, storage = globalThis.localStorage) => {
  try {
    storage?.setItem(localSessionKey({ classId, studentId }), JSON.stringify(createStudyRoomSessionSnapshot(snapshot)))
    return true
  } catch {
    return false
  }
}

export const clearLocalStudyRoomSession = ({ classId, studentId }, storage = globalThis.localStorage) => {
  try {
    storage?.removeItem(localSessionKey({ classId, studentId }))
    return true
  } catch {
    return false
  }
}

const activeSessionRef = (firestore, classId, studentId) => doc(
  firestore,
  ...studentPath(classId, studentId),
  'studyRoomActive',
  ACTIVE_SESSION_DOCUMENT,
)
const leaderboardRef = (firestore, classId, studentId) => doc(firestore, 'classes', classId, 'studyRoomLeaderboard', studentId)

const snapshotForFirestore = ({ classId, studentId, snapshot }) => ({
  ...createStudyRoomSessionSnapshot(snapshot),
  classId,
  ownerStudentId: studentId,
  updatedAt: serverTimestamp(),
})

export const getActiveStudyRoomSession = async ({ classId, studentId }) => {
  const snapshot = await getDoc(activeSessionRef(requireDb(), classId, studentId))
  return normalizeStudyRoomSessionSnapshot(snapshot.exists() ? snapshot.data() : null)
}

export const startOrResumeStudyRoomSession = async ({ classId, studentId, snapshot }) => {
  const firestore = requireDb()
  const reference = activeSessionRef(firestore, classId, studentId)
  return runTransaction(firestore, async (transaction) => {
    const existingSnapshot = await transaction.get(reference)
    const existing = normalizeStudyRoomSessionSnapshot(existingSnapshot.exists() ? existingSnapshot.data() : null)
    if (existing) return existing
    const next = createStudyRoomSessionSnapshot(snapshot)
    transaction.set(reference, snapshotForFirestore({ classId, studentId, snapshot: next }))
    return next
  })
}

export const updateActiveStudyRoomSession = async ({ classId, studentId, snapshot }) => {
  const firestore = requireDb()
  const reference = activeSessionRef(firestore, classId, studentId)
  const next = createStudyRoomSessionSnapshot(snapshot)
  return runTransaction(firestore, async (transaction) => {
    const currentSnapshot = await transaction.get(reference)
    const current = normalizeStudyRoomSessionSnapshot(currentSnapshot.exists() ? currentSnapshot.data() : null)
    if (current && current.sessionId !== next.sessionId) return current
    if (current && current.phaseStep > next.phaseStep) return current
    transaction.set(reference, snapshotForFirestore({ classId, studentId, snapshot: next }))
    return next
  })
}

export const closeActiveStudyRoomSession = async ({ classId, studentId, sessionId, status }) => {
  if (![STUDY_ROOM_SESSION_STATUS.COMPLETED, STUDY_ROOM_SESSION_STATUS.ABANDONED].includes(status)) {
    throw new Error('L’estat final de la sessió no és vàlid.')
  }
  const firestore = requireDb()
  const reference = activeSessionRef(firestore, classId, studentId)
  return runTransaction(firestore, async (transaction) => {
    const currentSnapshot = await transaction.get(reference)
    const current = currentSnapshot.data()
    if (!currentSnapshot.exists() || current?.sessionId !== cleanId(sessionId) || current?.status !== STUDY_ROOM_SESSION_STATUS.ACTIVE) return false
    transaction.update(reference, { status, updatedAt: serverTimestamp() })
    return true
  })
}

export const ensureStudyRoomLeaderboardEntry = async ({ classId, studentId, displayName }) => {
  const firestore = requireDb()
  const reference = leaderboardRef(firestore, classId, studentId)
  const progressRef = doc(firestore, ...studentPath(classId, studentId), 'studyRoomProgress', 'current')
  return runTransaction(firestore, async (transaction) => {
    const [entrySnapshot, progressSnapshot] = await Promise.all([transaction.get(reference), transaction.get(progressRef)])
    if (entrySnapshot.exists()) return entrySnapshot.data()
    const entry = {
      studentId,
      displayName: String(displayName ?? '').trim().slice(0, 80),
      totalXp: Number(progressSnapshot.data()?.totalXp) || 0,
      updatedAt: serverTimestamp(),
    }
    transaction.set(reference, entry)
    return entry
  })
}

export const observeStudyRoomPodium = ({ classId }, onData, onError) => onSnapshot(
  doc(requireDb(), 'classes', classId, 'studyRoomPodium', 'current'),
  (snapshot) => onData(snapshot.exists() ? snapshot.data() : { entries: [], totalStudents: 0 }),
  onError,
)

export const observePrivateStudyRoomRanking = ({ classId, studentId }, onData, onError) => onSnapshot(
  doc(requireDb(), ...studentPath(classId, studentId), 'private', 'studyRoomRanking'),
  (snapshot) => onData(snapshot.exists() ? snapshot.data() : null),
  onError,
)

const refreshStudyRoomRanking = async ({ classId, entries }) => {
  const firestore = requireDb()
  const ranking = buildStudyRoomLeaderboard(entries)
  const previousSnapshots = await Promise.all(ranking.map((entry) => getDoc(doc(
    firestore,
    ...studentPath(classId, entry.studentId),
    'private',
    'studyRoomRanking',
  ))))
  const batch = writeBatch(firestore)
  batch.set(doc(firestore, 'classes', classId, 'studyRoomPodium', 'current'), {
    entries: ranking.slice(0, 5).map(({ studentId, displayName, totalXp, position }) => ({ studentId, displayName, totalXp, position })),
    totalStudents: ranking.length,
    updatedAt: serverTimestamp(),
  })
  ranking.forEach((entry, index) => {
    const previous = previousSnapshots[index].data() ?? {}
    const oldPosition = Number(previous.position) || null
    const movement = oldPosition ? oldPosition - entry.position : 0
    const movementChanged = movement !== 0
    batch.set(doc(firestore, ...studentPath(classId, entry.studentId), 'private', 'studyRoomRanking'), {
      position: entry.position,
      totalStudents: ranking.length,
      totalXp: entry.totalXp,
      lastMovement: movementChanged ? movement : (Number(previous.lastMovement) || 0),
      movementId: movementChanged ? (globalThis.crypto?.randomUUID?.() ?? `movement-${Date.now()}-${entry.studentId}`) : (previous.movementId ?? null),
      movementAt: movementChanged ? serverTimestamp() : (previous.movementAt ?? null),
      updatedAt: serverTimestamp(),
    })
  })
  await batch.commit()
}

export const observeAndRefreshStudyRoomRanking = ({ classId }, onError = () => {}) => {
  let refreshQueued = Promise.resolve()
  return observeWithPermissionRetry({
    subscribe: (handleError) => onSnapshot(
      collection(requireDb(), 'classes', classId, 'studyRoomLeaderboard'),
      (snapshot) => {
        const entries = snapshot.docs.map((entry) => entry.data())
        refreshQueued = refreshQueued.then(() => refreshStudyRoomRanking({ classId, entries })).catch(onError)
      },
      handleError,
    ),
    onError,
  })
}

export const getStudyRoomSessionBlocks = async ({ classId, studentId, sessionId }) => {
  const firestore = requireDb()
  const safeSessionId = cleanId(sessionId)
  const basePath = studentPath(classId, studentId)
  const snapshots = await Promise.all([1, 2].map((blockNumber) => getDoc(doc(
    collection(firestore, ...basePath, 'studyRoomBlocks'),
    `${safeSessionId}--${blockNumber}`,
  ))))
  return snapshots.filter((snapshot) => snapshot.exists()).map((snapshot) => snapshot.data())
}

export const awardStudyRoomBlock = async ({
  classId,
  studentId,
  sessionId,
  blockNumber,
  durationMinutes = 30,
  reflection = '',
}) => {
  const firestore = requireDb()
  const safeSessionId = cleanId(sessionId)
  if (!safeSessionId || ![1, 2].includes(blockNumber) || ![25, 30, 45].includes(durationMinutes)) {
    throw new Error('El bloc d’estudi no és vàlid.')
  }

  const dayKey = localDayKey()
  const eventId = getStudyRoomBlockEventId(safeSessionId, blockNumber)
  const basePath = studentPath(classId, studentId)
  const eventRef = doc(collection(firestore, ...basePath, 'studyRoomBlocks'), eventId)
  const firstBlockRef = doc(collection(firestore, ...basePath, 'studyRoomBlocks'), getStudyRoomBlockEventId(safeSessionId, 1))
  const dayRef = doc(firestore, ...basePath, 'studyRoomDays', dayKey)
  const progressRef = doc(firestore, ...basePath, 'studyRoomProgress', 'current')
  const activeRef = activeSessionRef(firestore, classId, studentId)
  const studentRef = doc(firestore, ...basePath)

  return runTransaction(firestore, async (transaction) => {
    const [eventSnapshot, firstBlockSnapshot, daySnapshot, progressSnapshot, activeSnapshot, studentSnapshot] = await Promise.all([
      transaction.get(eventRef),
      transaction.get(firstBlockRef),
      transaction.get(dayRef),
      transaction.get(progressRef),
      transaction.get(activeRef),
      transaction.get(studentRef),
    ])
    const currentTotalXp = Number(progressSnapshot.data()?.totalXp) || 0
    const currentRewardedBlocks = Number(progressSnapshot.data()?.rewardedBlocks) || 0
    if (eventSnapshot.exists()) {
      const event = eventSnapshot.data()
      return { awarded: event.xp > 0, xp: event.xp, reason: 'already_awarded', totalXp: currentTotalXp }
    }

    const activeSession = activeSnapshot.data()
    if (!activeSnapshot.exists() || activeSession?.status !== STUDY_ROOM_SESSION_STATUS.ACTIVE || activeSession?.sessionId !== safeSessionId) {
      throw new Error('Aquesta sessió ja no és l’activa. Recarrega la Sala d’estudi abans de continuar.')
    }

    if (blockNumber === 2 && !firstBlockSnapshot.exists()) throw new Error('Cal completar el primer bloc abans de registrar el segon.')

    const currentDay = daySnapshot.data() ?? {}
    const dailyXp = Number(currentDay.xp) || 0
    const completedBlocks = Number(currentDay.completedBlocks) || 0
    const completedSessions = Number(currentDay.completedSessions) || 0
    const decision = getStudyRoomXpDecision({ blockNumber, dailyXp, firstBlockCompleted: firstBlockSnapshot.exists() })
    const nextDailyXp = dailyXp + decision.xp
    const cleanReflection = String(reflection ?? '').trim().slice(0, 240)

    transaction.set(dayRef, {
      classId,
      ownerStudentId: studentId,
      dayKey,
      completedBlocks: completedBlocks + 1,
      completedSessions: completedSessions + (blockNumber === 2 || (blockNumber === 1 && durationMinutes === 25) ? 1 : 0),
      xp: nextDailyXp,
      updatedAt: serverTimestamp(),
    })
    if (decision.awarded) {
      transaction.set(progressRef, { classId, ownerStudentId: studentId, totalXp: currentTotalXp + decision.xp, rewardedBlocks: currentRewardedBlocks + 1, updatedAt: serverTimestamp() })
      transaction.set(leaderboardRef(firestore, classId, studentId), {
        studentId,
        displayName: String(studentSnapshot.data()?.displayName ?? '').trim().slice(0, 80),
        totalXp: currentTotalXp + decision.xp,
        updatedAt: serverTimestamp(),
      })
    }
    transaction.set(eventRef, {
      classId,
      ownerStudentId: studentId,
      sessionId: safeSessionId,
      blockNumber,
      dayKey,
      durationMinutes,
      reflection: cleanReflection,
      xp: decision.xp,
      dailyXpAfter: nextDailyXp,
      reason: decision.reason,
      createdAt: serverTimestamp(),
    })
    return { ...decision, totalXp: currentTotalXp + decision.xp }
  })
}

export const observeStudyRoomProgress = ({ classId, studentId }, onData, onError) => onSnapshot(
  doc(requireDb(), ...studentPath(classId, studentId), 'studyRoomProgress', 'current'),
  (snapshot) => onData(snapshot.exists() ? snapshot.data() : { totalXp: 0, rewardedBlocks: 0 }),
  onError,
)

export const observeStudyRoomDay = ({ classId, studentId }, onData, onError) => onSnapshot(
  doc(requireDb(), ...studentPath(classId, studentId), 'studyRoomDays', localDayKey()),
  (snapshot) => onData(snapshot.exists() ? snapshot.data() : { completedBlocks: 0, completedSessions: 0, xp: 0 }),
  onError,
)
