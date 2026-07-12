import {
  clearIndexedDbPersistence,
  terminate,
  waitForPendingWrites,
} from 'firebase/firestore'
import {
  isOfflinePersistenceEnabled,
  saveOfflinePersistencePreference,
} from '../domain/offlinePolicy.js'
import { db } from '../lib/firebase.js'

export const observeConnectivity = (listener) => {
  const emit = () => listener(globalThis.navigator?.onLine ?? true)
  globalThis.addEventListener?.('online', emit)
  globalThis.addEventListener?.('offline', emit)
  emit()

  return () => {
    globalThis.removeEventListener?.('online', emit)
    globalThis.removeEventListener?.('offline', emit)
  }
}

export const enableTrustedDevicePersistence = () => {
  if (!saveOfflinePersistencePreference(true)) {
    throw new Error('El navegador no permet desar la preferència local.')
  }
  globalThis.location?.reload()
}

export const clearOfflineDataAndDisable = async () => {
  if (globalThis.navigator?.onLine === false) {
    throw new Error('Connecta el dispositiu abans d’esborrar la còpia local.')
  }
  if (db) await waitForPendingWrites(db)
  saveOfflinePersistencePreference(false)
  if (db) {
    try {
      await terminate(db)
      await clearIndexedDbPersistence(db)
    } finally {
      globalThis.location?.reload()
    }
    return
  }
  globalThis.location?.reload()
}

export const synchronizePendingWrites = async () => {
  if (!db) throw new Error('Firestore no està configurat.')
  if (globalThis.navigator?.onLine === false) {
    throw new Error('No hi ha connexió. Els canvis es conservaran al dispositiu.')
  }
  await waitForPendingWrites(db)
}

export const getOfflinePersistencePreference = () =>
  isOfflinePersistenceEnabled()
