export const OFFLINE_PREFERENCE_KEY = 'company-estudi:offline-persistence'

export const SYNC_STATE = Object.freeze({
  OFFLINE: 'offline',
  CACHED: 'cached',
  PENDING: 'pending',
  SYNCED: 'synced',
})

const safeStorage = (storage) => {
  try {
    return storage ?? null
  } catch {
    return null
  }
}

const defaultStorage = () => {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

export const isOfflinePersistenceEnabled = (storage) => {
  try {
    return safeStorage(storage === undefined ? defaultStorage() : storage)
      ?.getItem(OFFLINE_PREFERENCE_KEY) === 'enabled'
  } catch {
    return false
  }
}

export const saveOfflinePersistencePreference = (
  enabled,
  storage,
) => {
  const availableStorage = safeStorage(storage === undefined ? defaultStorage() : storage)
  if (!availableStorage) return false
  try {
    if (enabled) availableStorage.setItem(OFFLINE_PREFERENCE_KEY, 'enabled')
    else availableStorage.removeItem(OFFLINE_PREFERENCE_KEY)
    return true
  } catch {
    return false
  }
}

export const resolveSyncState = ({
  online,
  fromCache = false,
  hasPendingWrites = false,
}) => {
  if (!online) return SYNC_STATE.OFFLINE
  if (hasPendingWrites) return SYNC_STATE.PENDING
  if (fromCache) return SYNC_STATE.CACHED
  return SYNC_STATE.SYNCED
}
