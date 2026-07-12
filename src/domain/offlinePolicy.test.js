import { describe, expect, it } from 'vitest'
import {
  OFFLINE_PREFERENCE_KEY,
  SYNC_STATE,
  isOfflinePersistenceEnabled,
  resolveSyncState,
  saveOfflinePersistencePreference,
} from './offlinePolicy.js'

const createMemoryStorage = () => {
  const values = new Map()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  }
}

describe('política de connexió i persistència', () => {
  it('només activa la persistència després del consentiment', () => {
    const storage = createMemoryStorage()
    expect(isOfflinePersistenceEnabled(storage)).toBe(false)
    expect(saveOfflinePersistencePreference(true, storage)).toBe(true)
    expect(storage.getItem(OFFLINE_PREFERENCE_KEY)).toBe('enabled')
    expect(isOfflinePersistenceEnabled(storage)).toBe(true)
    saveOfflinePersistencePreference(false, storage)
    expect(isOfflinePersistenceEnabled(storage)).toBe(false)
  })

  it('prioritza sense connexió i canvis pendents', () => {
    expect(resolveSyncState({ online: false, hasPendingWrites: true })).toBe(SYNC_STATE.OFFLINE)
    expect(resolveSyncState({ online: true, hasPendingWrites: true })).toBe(SYNC_STATE.PENDING)
    expect(resolveSyncState({ online: true, fromCache: true })).toBe(SYNC_STATE.CACHED)
    expect(resolveSyncState({ online: true })).toBe(SYNC_STATE.SYNCED)
  })

  it('falla de manera segura si no hi ha emmagatzematge', () => {
    expect(isOfflinePersistenceEnabled(null)).toBe(false)
    expect(saveOfflinePersistencePreference(true, null)).toBe(false)
  })
})
