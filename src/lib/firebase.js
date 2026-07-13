import { getApp, getApps, initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import {
  connectFirestoreEmulator,
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
} from 'firebase/firestore'
import { disableLegacyOfflinePersistence } from '../domain/offlinePolicy.js'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

const requiredConfig = ['apiKey', 'authDomain', 'projectId', 'appId']

export const isFirebaseConfigured = requiredConfig.every(
  (key) => Boolean(firebaseConfig[key]),
)

export const firebaseApp = isFirebaseConfigured
  ? getApps()[0] ?? initializeApp(firebaseConfig)
  : null

export const auth = firebaseApp ? getAuth(firebaseApp) : null
export const offlinePersistenceRequested = false
export const firebaseEmulatorsEnabled = import.meta.env.DEV
  && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true'
const emulatorAuthInstances = new WeakSet()

const connectProjectAuthEmulator = (authInstance) => {
  if (!firebaseEmulatorsEnabled || !authInstance || emulatorAuthInstances.has(authInstance)) return authInstance
  connectAuthEmulator(authInstance, 'http://127.0.0.1:9099', { disableWarnings: true })
  emulatorAuthInstances.add(authInstance)
  return authInstance
}

const initializeProjectFirestore = () => {
  if (!firebaseApp) return null
  disableLegacyOfflinePersistence({ projectId: firebaseConfig.projectId })
  try {
    return initializeFirestore(firebaseApp, {
      localCache: memoryLocalCache(),
    })
  } catch {
    return getFirestore(firebaseApp)
  }
}

export const db = initializeProjectFirestore()
export const firebaseProjectId = firebaseConfig.projectId ?? null

if (firebaseEmulatorsEnabled) {
  connectProjectAuthEmulator(auth)
  if (db) connectFirestoreEmulator(db, '127.0.0.1', 8080)
}

export const getStudentProvisioningAuth = () => {
  if (!isFirebaseConfigured) return null
  const appName = 'student-provisioning'
  const provisioningApp = getApps().some((app) => app.name === appName)
    ? getApp(appName)
    : initializeApp(firebaseConfig, appName)
  return connectProjectAuthEmulator(getAuth(provisioningApp))
}

export const enableFirebaseAnalytics = async () => {
  if (!firebaseApp || !import.meta.env.PROD) return null

  const { getAnalytics, isSupported } = await import('firebase/analytics')
  if (!(await isSupported())) return null

  return getAnalytics(firebaseApp)
}
