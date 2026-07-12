import {
  GoogleAuthProvider,
  signInAnonymously,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import { auth } from '../lib/firebase.js'

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
  signInAnonymously(requireAuth())

export const signOutCurrentUser = () => signOut(requireAuth())

