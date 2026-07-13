import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import {
  DEFAULT_GAMIFICATION_PREFERENCES,
  GAMIFICATION_ACTIONS,
  canAwardGamificationAction,
  getWeekKey,
} from '../domain/gamification.js'
import { db } from '../lib/firebase.js'

const requireDb = () => {
  if (!db) throw new Error('Firestore no està configurat.')
  return db
}

const studentPath = (classId, studentId) => ['classes', classId, 'students', studentId]
const eventsCollection = (classId, studentId) => collection(requireDb(), ...studentPath(classId, studentId), 'gamificationEvents')
const preferencesReference = (classId, studentId) => doc(requireDb(), ...studentPath(classId, studentId), 'gamification', 'preferences')
const contributionCollection = (classId, studentId) => collection(requireDb(), ...studentPath(classId, studentId), 'missionContributions')
const missionCollection = (classId) => collection(requireDb(), 'classes', classId, 'cooperativeMissions')

const snapshotList = (snapshot) => snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))

export const observeStudentGamification = ({ classId, studentId }, onData, onError) => {
  const state = { events: [], preferences: DEFAULT_GAMIFICATION_PREFERENCES, missions: [], contributions: [] }
  const emit = () => onData({ ...state })
  const stops = [
    onSnapshot(eventsCollection(classId, studentId), (snapshot) => { state.events = snapshotList(snapshot); emit() }, onError),
    onSnapshot(preferencesReference(classId, studentId), (snapshot) => {
      state.preferences = snapshot.exists() ? { ...DEFAULT_GAMIFICATION_PREFERENCES, ...snapshot.data() } : DEFAULT_GAMIFICATION_PREFERENCES
      emit()
    }, onError),
    onSnapshot(missionCollection(classId), (snapshot) => { state.missions = snapshotList(snapshot); emit() }, onError),
    onSnapshot(contributionCollection(classId, studentId), (snapshot) => { state.contributions = snapshotList(snapshot); emit() }, onError),
  ]
  return () => stops.forEach((stop) => stop())
}

export const observeClassMissions = (classId, onData, onError) => onSnapshot(
  missionCollection(classId),
  (snapshot) => onData(snapshotList(snapshot)),
  onError,
)

export const tryAwardGamificationAction = async ({ classId, studentId, action, sourceId }) => {
  try {
    const preferencesSnapshot = await getDoc(preferencesReference(classId, studentId))
    if (preferencesSnapshot.exists() && preferencesSnapshot.data().mode === 'off') return false
    const existingSnapshot = await getDocs(eventsCollection(classId, studentId))
    const existingEvents = snapshotList(existingSnapshot)
    const decision = canAwardGamificationAction({ events: existingEvents, action, sourceId })
    if (!decision.allowed) return false
    const eventRef = doc(eventsCollection(classId, studentId), decision.eventId)
    return await runTransaction(requireDb(), async (transaction) => {
      const eventSnapshot = await transaction.get(eventRef)
      if (eventSnapshot.exists()) return false
      transaction.set(eventRef, {
        classId,
        ownerStudentId: studentId,
        action,
        sourceId,
        weekKey: decision.weekKey,
        xp: decision.xp,
        createdAt: serverTimestamp(),
      })
      return true
    })
  } catch (error) {
    console.warn('No s’ha pogut registrar el reconeixement de gamificació.', error)
    return false
  }
}

export const saveGamificationPreferences = async ({ classId, studentId, preferences }) => {
  const mode = ['full', 'reduced', 'off'].includes(preferences.mode) ? preferences.mode : 'full'
  const accessory = String(preferences.accessory ?? 'none').slice(0, 40)
  await setDoc(preferencesReference(classId, studentId), {
    mode,
    animationsEnabled: Boolean(preferences.animationsEnabled),
    accessory,
    updatedAt: serverTimestamp(),
  }, { merge: true })
}

export const createCooperativeMission = async ({ tutorId, classId, input }) => {
  const title = String(input.title ?? '').trim().replace(/\s+/g, ' ')
  const description = String(input.description ?? '').trim().replace(/\s+/g, ' ')
  const target = Number(input.target)
  if (title.length < 3 || title.length > 80 || description.length < 3 || description.length > 240) {
    throw new Error('La missió necessita un títol i una explicació breu.')
  }
  if (!GAMIFICATION_ACTIONS[input.action] || !Number.isInteger(target) || target < 2 || target > 40) {
    throw new Error('L’acció o l’objectiu de la missió no és vàlid.')
  }
  await setDoc(doc(missionCollection(classId)), {
    classId,
    title,
    description,
    action: input.action,
    target,
    progress: 0,
    weekKey: getWeekKey(),
    status: 'active',
    createdByTutorId: tutorId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export const contributeToCooperativeMission = async ({ classId, studentId, mission, events }) => {
  const weekKey = getWeekKey()
  const eligible = events.some((event) => event.action === mission.action && event.weekKey === weekKey)
  if (!eligible) throw new Error('Primer completa l’hàbit relacionat amb aquesta missió.')
  const missionRef = doc(requireDb(), 'classes', classId, 'cooperativeMissions', mission.id)
  const contributionRef = doc(requireDb(), ...studentPath(classId, studentId), 'missionContributions', mission.id)
  await runTransaction(requireDb(), async (transaction) => {
    const [missionSnapshot, contributionSnapshot] = await Promise.all([
      transaction.get(missionRef),
      transaction.get(contributionRef),
    ])
    if (!missionSnapshot.exists() || missionSnapshot.data().status !== 'active') throw new Error('Aquesta missió ja no està activa.')
    if (contributionSnapshot.exists()) throw new Error('La teva aportació ja està comptada.')
    const current = Number(missionSnapshot.data().progress) || 0
    const target = Number(missionSnapshot.data().target) || 1
    const next = Math.min(target, current + 1)
    transaction.set(contributionRef, {
      classId,
      ownerStudentId: studentId,
      missionId: mission.id,
      weekKey,
      contributedAt: serverTimestamp(),
    })
    transaction.update(missionRef, {
      progress: next,
      status: next >= target ? 'completed' : 'active',
      updatedAt: serverTimestamp(),
    })
  })
}
