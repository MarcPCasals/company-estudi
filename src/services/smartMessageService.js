import { collection, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { normalizeSmartMessageState } from '../domain/smartMessages.js'
import { db } from '../lib/firebase.js'

const requireDb = () => { if (!db) throw new Error('Firestore no està configurat.'); return db }
const statesPath = (classId, studentId) => ['classes', classId, 'students', studentId, 'private', 'smartMessages', 'states']

export const observeSmartMessageStates = ({ classId, studentId }, onData, onError) => onSnapshot(
  collection(requireDb(), ...statesPath(classId, studentId)),
  (snapshot) => onData(Object.fromEntries(snapshot.docs.map((item) => [item.id, item.data()]))),
  onError,
)

export const saveSmartMessageState = ({ classId, studentId, messageId, status, until = null }) => {
  const normalized = normalizeSmartMessageState({ status, until })
  return setDoc(doc(requireDb(), ...statesPath(classId, studentId), encodeURIComponent(messageId)), {
    messageId, ...normalized, updatedAt: serverTimestamp(),
  }, { merge: true })
}
