import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithCredential,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { deriveStudentCredentials } from '../domain/technicalCredentials.js'
import { auth, db, firebaseEmulatorsEnabled } from '../lib/firebase.js'

const requireAuth = () => {
  if (!auth) {
    throw new Error('Firebase no està configurat en aquest entorn.')
  }
  return auth
}

export const signInTutorWithGoogle = async () => {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  return signInWithPopup(requireAuth(), provider)
}

const base64Url = (value) => globalThis.btoa(JSON.stringify(value))
  .replace(/=/g, '')
  .replace(/\+/g, '-')
  .replace(/\//g, '_')

export const signInTestTutor = async () => {
  if (!firebaseEmulatorsEnabled) throw new Error('L’accés de prova només existeix amb els emuladors locals.')
  const now = Math.floor(Date.now() / 1000)
  const idToken = `${base64Url({ alg: 'none', typ: 'JWT' })}.${base64Url({
    sub: 'tutor-validacio-b11',
    email: 'tutor.validacio@example.test',
    name: 'Tutor de validacio',
    aud: 'company-estudi',
    iat: now,
    exp: now + 3600,
  })}.`
  return signInWithCredential(requireAuth(), GoogleAuthProvider.credential(idToken))
}

export const exchangeStudentAccessCodes = async ({ classCode, studentCode }) => {
  if (!db) throw new Error('Firestore no està configurat en aquest entorn.')
  const credentials = await deriveStudentCredentials({ classCode, studentCode })
  const result = await signInWithEmailAndPassword(
    requireAuth(),
    credentials.email,
    credentials.password,
  )
  return loadCurrentStudentContext(result.user)
}

export const loadCurrentStudentContext = async (user = auth?.currentUser) => {
  if (!db || !user) return null
  const accessSnapshot = await getDoc(doc(db, 'studentAccess', user.uid))
  const access = accessSnapshot.data()

  if (!accessSnapshot.exists() || access?.active !== true) {
    await signOut(requireAuth())
    throw new Error('Aquesta credencial no està vinculada a cap alumne actiu.')
  }

  const [studentSnapshot, classSnapshot] = await Promise.all([
    getDoc(doc(db, 'classes', access.classId, 'students', access.studentId)),
    getDoc(doc(db, 'classes', access.classId)),
  ])
  if (!studentSnapshot.exists() || !classSnapshot.exists()) {
    await signOut(requireAuth())
    throw new Error('No s’ha trobat l’espai de l’alumne.')
  }

  return {
    classId: access.classId,
    studentId: access.studentId,
    credentialVersion: access.credentialVersion,
    displayName: studentSnapshot.data().displayName,
    className: classSnapshot.data().name,
    course: classSnapshot.data().course,
    schoolSchedule: classSnapshot.data().schoolSchedule,
  }
}

export const signOutCurrentUser = async () => {
  await signOut(requireAuth())
  globalThis.location?.reload()
}

export const observeCurrentUser = (listener) =>
  onAuthStateChanged(requireAuth(), listener)
