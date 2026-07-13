import { collection, doc, onSnapshot, serverTimestamp, setDoc, updateDoc, writeBatch } from 'firebase/firestore'
import { buildSupportiveNotice, normalizeTutorialGoal, normalizeTutorFeedback, normalizeWeeklyReview } from '../domain/tutorialAnalytics.js'
import { localDateKey } from '../domain/calendarPlanning.js'
import { db } from '../lib/firebase.js'
import { planStudentTask } from './taskService.js'
import { GAMIFICATION_ACTION, getWeekKey } from '../domain/gamification.js'
import { tryAwardGamificationAction } from './gamificationService.js'

const requireDb = () => { if (!db) throw new Error('Firestore no està configurat.'); return db }
const studentPath = (classId, studentId) => ['classes', classId, 'students', studentId]
const collectionData = (snapshot) => snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))

export const observeTutorClassActivity = ({ classId, students }, onData, onError) => {
  const state = { tasksByStudent: {}, sessionsByStudent: {} }
  const emit = () => onData({ ...state, tasksByStudent: { ...state.tasksByStudent }, sessionsByStudent: { ...state.sessionsByStudent } })
  const stops = students.flatMap((student) => ['tasks', 'studySessions'].map((name) => onSnapshot(
    collection(requireDb(), ...studentPath(classId, student.id), name),
    (snapshot) => { state[name === 'tasks' ? 'tasksByStudent' : 'sessionsByStudent'][student.id] = collectionData(snapshot); emit() },
    onError,
  )))
  return () => stops.forEach((stop) => stop())
}

export const observeStudentTutorial = ({ classId, studentId }, onData, onError) => {
  const state = { goal: null, reviews: [], feedback: [], suggestions: [], notices: [], tasks: [], availability: null }
  const emit = () => onData({ ...state })
  const observeList = (key, name) => onSnapshot(collection(requireDb(), ...studentPath(classId, studentId), name), (snapshot) => { state[key] = collectionData(snapshot); emit() }, onError)
  const stops = [
    observeList('reviews', 'tutorialSubmissions'), observeList('feedback', 'tutorFeedback'),
    observeList('suggestions', 'sessionSuggestions'), observeList('notices', 'notices'), observeList('tasks', 'tasks'),
    onSnapshot(doc(requireDb(), ...studentPath(classId, studentId), 'tutorialGoals', 'current'), (snapshot) => { state.goal = snapshot.exists() ? snapshot.data() : null; emit() }, onError),
    onSnapshot(doc(requireDb(), ...studentPath(classId, studentId), 'availability', 'current'), (snapshot) => { state.availability = snapshot.exists() ? snapshot.data() : null; emit() }, onError),
  ]
  return () => stops.forEach((stop) => stop())
}

export const saveTutorialGoal = async ({ tutorId, classId, studentId, input }) => setDoc(doc(requireDb(), ...studentPath(classId, studentId), 'tutorialGoals', 'current'), {
  classId, studentId, authorTutorId: tutorId, ...normalizeTutorialGoal(input), updatedAt: serverTimestamp(),
}, { merge: true })

export const submitWeeklyReview = async ({ classId, studentId, input }) => {
  const monday = new Date(); monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  const reviewId = localDateKey(monday)
  await setDoc(doc(requireDb(), ...studentPath(classId, studentId), 'tutorialSubmissions', reviewId), {
    classId, ownerStudentId: studentId, ...normalizeWeeklyReview(input), submittedAt: serverTimestamp(), updatedAt: serverTimestamp(),
  }, { merge: true })
  await tryAwardGamificationAction({
    classId,
    studentId,
    action: GAMIFICATION_ACTION.WEEKLY_REVIEW,
    sourceId: getWeekKey(),
  })
}

export const createTutorFeedback = async ({ tutorId, classId, studentId, input }) => setDoc(doc(collection(requireDb(), ...studentPath(classId, studentId), 'tutorFeedback')), {
  classId, studentId, authorTutorId: tutorId, ...normalizeTutorFeedback(input), createdAt: serverTimestamp(),
})

export const createSessionSuggestion = async ({ tutorId, classId, studentId, input }) => {
  const at = new Date(input.scheduledAt); const duration = Number(input.durationMinutes)
  if (!input.taskId || Number.isNaN(at.getTime()) || !Number.isInteger(duration) || duration < 10 || duration > 240) throw new Error('La proposta de sessió no és vàlida.')
  await setDoc(doc(collection(requireDb(), ...studentPath(classId, studentId), 'sessionSuggestions')), {
    classId, studentId, taskId: input.taskId, scheduledAt: at.toISOString(), durationMinutes: duration,
    note: String(input.note ?? '').trim().slice(0, 300), status: 'pending', authorTutorId: tutorId, createdAt: serverTimestamp(),
  })
}

export const respondToSessionSuggestion = async ({ suggestion, task, accepted }) => {
  if (accepted) await planStudentTask(task, { scheduledAt: suggestion.scheduledAt, durationMinutes: suggestion.durationMinutes, reason: 'Proposta del tutor acceptada per l’alumne.' })
  await updateDoc(doc(requireDb(), ...studentPath(suggestion.classId, suggestion.studentId), 'sessionSuggestions', suggestion.id), { status: accepted ? 'accepted' : 'declined', respondedAt: serverTimestamp() })
}

export const sendTutorNotice = async ({ tutorId, classId, studentIds, audience, input }) => {
  if (!studentIds.length || studentIds.length > 40) throw new Error('Selecciona com a mínim un destinatari.')
  const notice = buildSupportiveNotice(input); const noticeId = doc(collection(requireDb(), 'classes')).id
  const batch = writeBatch(requireDb())
  studentIds.forEach((studentId) => batch.set(doc(requireDb(), ...studentPath(classId, studentId), 'notices', noticeId), {
    classId, studentId, audience, authorTutorId: tutorId, ...notice, createdAt: serverTimestamp(), readAt: null,
  }))
  await batch.commit()
}

export const markNoticeRead = ({ classId, studentId, noticeId }) => updateDoc(doc(requireDb(), ...studentPath(classId, studentId), 'notices', noticeId), { readAt: serverTimestamp() })
