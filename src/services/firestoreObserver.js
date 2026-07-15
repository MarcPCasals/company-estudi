export const observeWithPermissionRetry = ({ subscribe, onError = () => {}, maximumRetries = 2 }) => {
  let stopped = false
  let stopSnapshot = () => {}
  let retryTimer = null

  const start = (attempt = 0) => {
    stopSnapshot = subscribe((error) => {
      const shouldRetry = error?.code === 'permission-denied' && attempt < maximumRetries
      if (!stopped && shouldRetry) {
        retryTimer = globalThis.setTimeout(() => start(attempt + 1), 300 * (attempt + 1))
        return
      }
      onError(error)
    })
  }

  start()
  return () => {
    stopped = true
    if (retryTimer) globalThis.clearTimeout(retryTimer)
    stopSnapshot()
  }
}
