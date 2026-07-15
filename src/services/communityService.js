import { collection, deleteDoc, doc, getDoc, onSnapshot, serverTimestamp, setDoc, updateDoc, writeBatch } from 'firebase/firestore'
import { DEFAULT_SUBJECTS } from '../data/subjects.js'
import { normalizeCommunityPost, normalizeNotificationSettings, normalizeReply } from '../domain/communityPolicy.js'
import { db } from '../lib/firebase.js'
import { createStudentTask } from './taskService.js'

const requireDb = () => { if (!db) throw new Error('Firestore no està configurat.'); return db }
const roomPath = (classId, roomId) => ['classes', classId, 'rooms', roomId]

export const observeAccessibleRooms = ({ classId }, onData) => {
  const rooms = new Map(); const emit = () => onData([...rooms.values()].sort((a, b) => a.name.localeCompare(b.name, 'ca')))
  const stops = DEFAULT_SUBJECTS.map((subject) => onSnapshot(doc(requireDb(), ...roomPath(classId, subject.id)), (snapshot) => { if (snapshot.exists()) rooms.set(subject.id, { id: subject.id, ...snapshot.data() }); emit() }, () => { rooms.delete(subject.id); emit() }))
  return () => stops.forEach((stop) => stop())
}

export const observeRoomPosts = ({ classId, roomId }, onData, onError) => onSnapshot(collection(requireDb(), ...roomPath(classId, roomId), 'posts'), (snapshot) => onData(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })).sort((a, b) => (a.createdAt?.seconds ?? 0) - (b.createdAt?.seconds ?? 0))), onError)

export const createRoomPost = async ({ classId, roomId, author, input, parentPostId = null }) => {
  const normalized = parentPostId ? { type: 'reply', title: '', ...normalizeReply(input.body) } : normalizeCommunityPost({ ...input, authorRole: author.role })
  await setDoc(doc(collection(requireDb(), ...roomPath(classId, roomId), 'posts')), {
    classId, roomId, parentPostId, ...normalized, authorRole: author.role, authorName: author.name,
    ...(author.role === 'student' ? { authorStudentId: author.id } : { authorTutorId: author.id }),
    resolved: false, validated: false, hidden: false, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  })
}

export const updatePostState = ({ classId, roomId, postId, changes }) => updateDoc(doc(requireDb(), ...roomPath(classId, roomId), 'posts', postId), { ...changes, updatedAt: serverTimestamp() })

export const reportPost = ({ classId, roomId, postId, studentId, reason }) => setDoc(doc(requireDb(), ...roomPath(classId, roomId), 'reports', `${postId}-${studentId}`), { classId, roomId, postId, reporterStudentId: studentId, reason: String(reason).trim().slice(0, 300), status: 'open', createdAt: serverTimestamp() })

export const observeRoomReports = ({ classId, roomId }, onData, onError) => onSnapshot(collection(requireDb(), ...roomPath(classId, roomId), 'reports'), (snapshot) => onData(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))), onError)
export const resolveReport = ({ classId, roomId, reportId }) => updateDoc(doc(requireDb(), ...roomPath(classId, roomId), 'reports', reportId), { status: 'reviewed', reviewedAt: serverTimestamp() })

export const observeUsefulMarks = ({ classId, roomId, postId }, onData) => onSnapshot(collection(requireDb(), ...roomPath(classId, roomId), 'posts', postId, 'usefulMarks'), (snapshot) => onData(snapshot.docs.map((item) => item.id)))
export const toggleUsefulMark = async ({ classId, roomId, postId, studentId, active }) => { const ref = doc(requireDb(), ...roomPath(classId, roomId), 'posts', postId, 'usefulMarks', studentId); if (active) await deleteDoc(ref); else await setDoc(ref, { studentId, createdAt: serverTimestamp() }) }

export const askPrivateQuestion = ({ classId, studentId, body }) => setDoc(doc(collection(requireDb(), 'classes', classId, 'students', studentId, 'privateQuestions')), { classId, ownerStudentId: studentId, body: String(body).trim().slice(0, 1000), response: '', status: 'open', createdAt: serverTimestamp() })
export const observePrivateQuestions = ({ classId, studentId }, onData, onError) => onSnapshot(collection(requireDb(), 'classes', classId, 'students', studentId, 'privateQuestions'), (snapshot) => onData(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))), onError)
export const answerPrivateQuestion = ({ classId, studentId, questionId, response }) => updateDoc(doc(requireDb(), 'classes', classId, 'students', studentId, 'privateQuestions', questionId), { response: String(response).trim().slice(0, 1000), status: 'answered', answeredAt: serverTimestamp() })

export const observeOfficialTasks = ({ classId }, onData, onError) => onSnapshot(collection(requireDb(), 'classes', classId, 'officialTasks'), (snapshot) => onData(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))), onError)
export const addOfficialTaskToStudent = ({ classId, studentId, task }) => createStudentTask({ classId, studentId, input: { subjectId: task.subjectId, title: task.title, taskType: task.taskType ?? 'homework', deadline: { certainty: task.deadline?.certainty ?? 'without_date', at: task.deadline?.at ?? null }, estimatedMinutes: '', steps: [], material: '', privateNote: '', helpRequested: false, requiresDelivery: true, needsClarification: false } })

export const resolveCommonCandidate = async ({ tutorId, classId, candidate, action, correction = {} }) => {
  const candidateRef = doc(requireDb(), 'classes', classId, 'taskCandidates', candidate.fingerprint)
  const batch = writeBatch(requireDb()); const record = { classId, fingerprint: candidate.fingerprint, subjectId: correction.subjectId ?? candidate.subjectId, title: correction.title ?? candidate.title, deadline: correction.deadline ?? candidate.deadline ?? null, count: candidate.count, requiredCount: candidate.requiredCount, status: action, reviewedByTutorId: tutorId, updatedAt: serverTimestamp() }
  batch.set(candidateRef, record, { merge: true })
  if (action === 'confirmed') batch.set(doc(collection(requireDb(), 'classes', classId, 'officialTasks')), { ...record, recordKind: 'official_task', confirmedByTutorId: tutorId, taskType: 'homework', createdAt: serverTimestamp() })
  await batch.commit()
}

export const observeCandidateDecisions = ({ classId }, onData) => onSnapshot(collection(requireDb(), 'classes', classId, 'taskCandidates'), (snapshot) => onData(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))))

export const observeClassTaskAlerts = ({ classId }, onData, onError) => onSnapshot(
  collection(requireDb(), 'classes', classId, 'taskAlerts'),
  (snapshot) => onData(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))),
  onError,
)

export const publishContradictionAlert = ({ tutorId, classId, alarm }) => setDoc(
  doc(requireDb(), 'classes', classId, 'taskAlerts', encodeURIComponent(alarm.id)),
  {
    classId,
    type: 'contradiction',
    topicKey: alarm.topicKey,
    subjectId: alarm.subjectId,
    title: alarm.title,
    count: alarm.count,
    variants: alarm.variants.map((variant) => ({ key: variant.key, count: variant.count, deadline: variant.deadline ?? null })),
    status: 'active',
    publishedByTutorId: tutorId,
    updatedAt: serverTimestamp(),
  },
  { merge: true },
)

export const resolveTaskAlert = ({ tutorId, classId, alertId }) => updateDoc(
  doc(requireDb(), 'classes', classId, 'taskAlerts', alertId),
  { status: 'resolved', resolvedByTutorId: tutorId, resolvedAt: serverTimestamp(), updatedAt: serverTimestamp() },
)

export const saveCommunitySettings = ({ classId, studentId, input }) => setDoc(doc(requireDb(), 'classes', classId, 'students', studentId, 'private', 'communitySettings'), { ...normalizeNotificationSettings(input), updatedAt: serverTimestamp() }, { merge: true })
export const loadCommunitySettings = async ({ classId, studentId }) => { const snapshot = await getDoc(doc(requireDb(), 'classes', classId, 'students', studentId, 'private', 'communitySettings')); return snapshot.exists() ? snapshot.data() : null }

export const markRoomRead = ({ classId, studentId, roomId }) => setDoc(doc(requireDb(), 'classes', classId, 'students', studentId, 'private', `roomRead-${roomId}`), { roomId, lastReadAt: serverTimestamp() }, { merge: true })
export const loadRoomRead = async ({ classId, studentId, roomId }) => { const snapshot = await getDoc(doc(requireDb(), 'classes', classId, 'students', studentId, 'private', `roomRead-${roomId}`)); return snapshot.data()?.lastReadAt?.toMillis?.() ?? 0 }

const timestampMillis = (value) => value?.toMillis?.() ?? ((value?.seconds ?? 0) * 1000)

export const countUnreadRoomPosts = ({ posts = [], lastReadAt = 0, studentId }) => posts.filter((post) => (
  !post.hidden
  && post.authorStudentId !== studentId
  && timestampMillis(post.createdAt) > lastReadAt
)).length

export const observeCommunityUnreadCount = ({ classId, studentId }, onData, onError) => {
  const roomState = new Map()
  const roomStops = new Map()
  const emit = () => onData([...roomState.values()].reduce((total, room) => total + countUnreadRoomPosts({
    posts: room.posts,
    lastReadAt: room.lastReadAt,
    studentId,
  }), 0))

  const stopRooms = observeAccessibleRooms({ classId }, (rooms) => {
    const accessibleIds = new Set(rooms.map((room) => room.id))

    roomStops.forEach((stop, roomId) => {
      if (!accessibleIds.has(roomId)) {
        stop()
        roomStops.delete(roomId)
        roomState.delete(roomId)
      }
    })

    rooms.forEach((room) => {
      if (roomStops.has(room.id)) return
      roomState.set(room.id, { posts: [], lastReadAt: 0 })
      const readRef = doc(requireDb(), 'classes', classId, 'students', studentId, 'private', `roomRead-${room.id}`)
      const stopRead = onSnapshot(readRef, (snapshot) => {
        const current = roomState.get(room.id)
        if (!current) return
        current.lastReadAt = timestampMillis(snapshot.data()?.lastReadAt)
        emit()
      }, onError)
      const stopPosts = observeRoomPosts({ classId, roomId: room.id }, (posts) => {
        const current = roomState.get(room.id)
        if (!current) return
        current.posts = posts
        emit()
      }, onError)
      roomStops.set(room.id, () => { stopRead(); stopPosts() })
    })
    emit()
  })

  return () => {
    stopRooms()
    roomStops.forEach((stop) => stop())
  }
}
