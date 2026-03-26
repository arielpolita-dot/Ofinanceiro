import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useConditionalPolling } from '../useConditionalPolling'

interface PollData {
  status: string
}

describe('useConditionalPolling', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('polls while shouldContinue returns true', async () => {
    const fetcher = vi.fn<() => Promise<PollData>>().mockResolvedValue({ status: 'processing' })

    const { result } = renderHook(() =>
      useConditionalPolling<PollData>(fetcher, {
        interval: 1000,
        enabled: true,
        shouldContinue: (data) => data?.status === 'processing',
      }),
    )

    await waitFor(() => {
      expect(result.current.data).toBeTruthy()
    })
    expect(fetcher).toHaveBeenCalled()
  })

  it('stops polling when shouldContinue returns false', async () => {
    let callCount = 0
    const fetcher = vi.fn<() => Promise<PollData>>().mockImplementation(() => {
      callCount++
      return Promise.resolve({
        status: callCount >= 2 ? 'completed' : 'processing',
      })
    })

    const { result } = renderHook(() =>
      useConditionalPolling<PollData>(fetcher, {
        interval: 1000,
        enabled: true,
        shouldContinue: (data) => data?.status !== 'completed',
      }),
    )

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.data).toBeTruthy()
    })

    // Advance to trigger second poll
    await act(async () => {
      vi.advanceTimersByTime(1500)
    })

    await waitFor(() => {
      expect(result.current.data?.status).toBe('completed')
    })
  })

  it('respects external enabled=false', async () => {
    const fetcher = vi.fn<() => Promise<PollData>>().mockResolvedValue({ status: 'processing' })

    renderHook(() =>
      useConditionalPolling<PollData>(fetcher, {
        interval: 1000,
        enabled: false,
        shouldContinue: () => true,
      }),
    )

    await act(async () => {
      vi.advanceTimersByTime(5000)
    })

    expect(fetcher).not.toHaveBeenCalled()
  })

  it('resets when enabled toggles from false to true', async () => {
    const fetcher = vi.fn<() => Promise<PollData>>().mockResolvedValue({ status: 'processing' })
    let enabled = false

    const { rerender } = renderHook(() =>
      useConditionalPolling<PollData>(fetcher, {
        interval: 1000,
        enabled,
        shouldContinue: () => true,
      }),
    )

    await act(async () => {
      vi.advanceTimersByTime(3000)
    })
    expect(fetcher).not.toHaveBeenCalled()

    enabled = true
    rerender()

    await waitFor(() => {
      expect(fetcher).toHaveBeenCalled()
    })
  })
})
