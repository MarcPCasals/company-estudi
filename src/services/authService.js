import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { deriveStudentCredentials } from '../domain/technicalCredentials.js'
import { auth, db } from '../lib/firebase.js'

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

export const exchangeStudentAccessCodes = async ({ classCode, studentCode }) => {
  if (!db) throw new Error('Firestore no està configurat en aquest entorn.')
  const credentials = await deriveStudentCredentials({ classCode, studentCode })
  const result = await signInWithEmailAndPassword(
    requireAuth(),
    credentials.email,
    credentials.password,
  )
  const accessSnapshot = await getDoc(doc(db, 'studentAccess', result.user.uid))
  const access = accessSnapshot.data()

  if (!accessSnapshot.exists() || access?.active !== true) {
    await signOut(requireAuth())
    throw new Error('Aquesta credencial no està vinculada a cap alumne actiu.')
  }

  return {
    classId: access.classId,
    studentId: access.studentId,
    credentialVersion: access.credentialVersion,
  }
}

export const signOutCurrentUser = () => signOut(requireAuth())

export const observeCurrentUser = (listener) =>
  onAuthStateChanged(requireAuth(), listener)
