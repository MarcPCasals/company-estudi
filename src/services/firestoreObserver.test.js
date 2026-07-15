import { afterEach, describe, expect, it, vi } from 'vitest'
import { observeWithPermissionRetry } from './firestoreObserver.js'

afterEach(() => vi.useRealTimers())

describe('represa dels observadors de Firestore', () => {
  it('reprèn un permís denegat transitori sense mostrar un error', async () => {
    vi.useFakeTimers()
    const onError = vi.fn()
    let attempts = 0
    const stop = observeWithPermissionRetry({
      subscribe: (handleError) => {
        attempts += 1
        if (attempts === 1) handleError({ code: 'permission-denied' })
        return vi.fn()
      },
      onError,
    })

    expect(attempts).toBe(1)
    await vi.advanceTimersByTimeAsync(300)
    expect(attempts).toBe(2)
    expect(onError).not.toHaveBeenCalled()
    stop()
  })

  it('informa dels errors persistents després de dos reintents', async () => {
    vi.useFakeTimers()
    const onError = vi.fn()
    const subscribe = (handleError) => {
      handleError({ code: 'permission-denied' })
      return vi.fn()
    }
    const stop = observeWithPermissionRetry({ subscribe, onError })

    await vi.advanceTimersByTimeAsync(900)
    expect(onError).toHaveBeenCalledOnce()
    stop()
  })
})
