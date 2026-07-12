import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import { httpsCallable } from 'firebase/functions'
import { auth, functions } from '../lib/firebase.js'

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

export const beginAnonymousStudentSession = () =>
  auth?.currentUser?.isAnonymous
    ? Promise.resolve({ user: auth.currentUser })
    : signInAnonymously(requireAuth())

export const exchangeStudentAccessCodes = async ({ classCode, studentCode }) => {
  await beginAnonymousStudentSession()

  if (!functions) {
    throw new Error('Firebase Functions no està configurat en aquest entorn.')
  }

  const exchangeCodes = httpsCallable(functions, 'exchangeStudentCodes')
  const result = await exchangeCodes({ classCode, studentCode })
  return result.data
}

export const signOutCurrentUser = () => signOut(requireAuth())

export const observeCurrentUser = (listener) =>
  onAuthStateChanged(requireAuth(), listener)
