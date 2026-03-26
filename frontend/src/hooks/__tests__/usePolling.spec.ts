import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { usePolling } from '../usePolling'

describe('usePolling', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('fetches data immediately when enabled', async () => {
    const fetcher = vi.fn().mockResolvedValue({ count: 42 })

    const { result } = renderHook(() =>
      usePolling(fetcher, { interval: 5000, enabled: true, immediate: true }),
    )

    await waitFor(() => {
      expect(result.current.data).toEqual({ count: 42 })
    })
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('does not fetch when disabled', async () => {
    const fetcher = vi.fn().mockResolvedValue({ count: 0 })

    renderHook(() =>
      usePolling(fetcher, { interval: 5000, enabled: false }),
    )

    await act(async () => {
      vi.advanceTimersByTime(10000)
    })

    expect(fetcher).not.toHaveBeenCalled()
  })

  it('sets error when fetcher rejects', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() =>
      usePolling(fetcher, { interval: 5000, enabled: true }),
    )

    await waitFor(() => {
      expect(result.current.error?.message).toBe('Network error')
    })
  })

  it('provides stopPolling control', async () => {
    const fetcher = vi.fn().mockResolvedValue('data')

    const { result } = renderHook(() =>
      usePolling(fetcher, { interval: 5000, enabled: true }),
    )

    await waitFor(() => {
      expect(result.current.data).toBe('data')
    })

    act(() => {
      result.current.stopPolling()
    })

    expect(result.current.isPolling).toBe(false)
  })

  it('refetch works independently of polling state', async () => {
    const fetcher = vi.fn().mockResolvedValue('initial')

    const { result } = renderHook(() =>
      usePolling(fetcher, { interval: 5000, enabled: false }),
    )

    fetcher.mockResolvedValueOnce('refetched')

    await act(async () => {
      await result.current.refetch()
    })

    expect(result.current.data).toBe('refetched')
  })

  it('delays first fetch when immediate is false', async () => {
    const fetcher = vi.fn().mockResolvedValue('delayed')

    renderHook(() =>
      usePolling(fetcher, { interval: 5000, enabled: true, immediate: false }),
    )

    expect(fetcher).not.toHaveBeenCalled()

    await act(async () => {
      vi.advanceTimersByTime(5000)
    })

    await waitFor(() => {
      expect(fetcher).toHaveBeenCalledTimes(1)
    })
  })

  it('calls onError callback when fetch fails', async () => {
    const onError = vi.fn()
    const fetcher = vi.fn().mockRejectedValue(new Error('Fail'))

    renderHook(() =>
      usePolling(fetcher, { interval: 5000, enabled: true, onError }),
    )

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(expect.any(Error))
    })
  })
})
