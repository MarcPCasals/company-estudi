import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import {
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'
import { isOfflinePersistenceEnabled } from '../domain/offlinePolicy.js'

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
export const offlinePersistenceRequested = isOfflinePersistenceEnabled()

const initializeProjectFirestore = () => {
  if (!firebaseApp) return null
  try {
    return initializeFirestore(firebaseApp, {
      localCache: offlinePersistenceRequested
        ? persistentLocalCache({ tabManager: persistentMultipleTabManager() })
        : memoryLocalCache(),
    })
  } catch {
    return getFirestore(firebaseApp)
  }
}

export const db = initializeProjectFirestore()
export const firebaseProjectId = firebaseConfig.projectId ?? null

export const getStudentProvisioningAuth = () => {
  if (!isFirebaseConfigured) return null
  const appName = 'student-provisioning'
  const provisioningApp = getApps().some((app) => app.name === appName)
    ? getApp(appName)
    : initializeApp(firebaseConfig, appName)
  return getAuth(provisioningApp)
}

export const enableFirebaseAnalytics = async () => {
  if (!firebaseApp || !import.meta.env.PROD) return null

  const { getAnalytics, isSupported } = await import('firebase/analytics')
  if (!(await isSupported())) return null

  return getAnalytics(firebaseApp)
}
