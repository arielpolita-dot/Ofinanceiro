import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('react-router-dom', () => ({
  useLocation: vi.fn(() => ({ pathname: '/test' })),
}))
vi.mock('../../services/analytics', () => ({
  initAnalytics: vi.fn(),
  trackPage: vi.fn(),
  track: vi.fn(),
  setAnalyticsUserId: vi.fn(),
  setAnalyticsUserProperties: vi.fn(),
  AnalyticsEvents: {},
}))

describe('useAnalytics', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('usePageTracking tracks page views', async () => {
    const analytics = await import('../../services/analytics')
    const { usePageTracking } = await import('../useAnalytics')
    renderHook(() => usePageTracking())
    expect(analytics.trackPage).toHaveBeenCalled()
  })

  it('useAnalyticsInit calls initAnalytics', async () => {
    const analytics = await import('../../services/analytics')
    const { useAnalyticsInit } = await import('../useAnalytics')
    renderHook(() => useAnalyticsInit())
    expect(analytics.initAnalytics).toHaveBeenCalled()
  })

  it('useAnalytics returns tracking functions', async () => {
    const { useAnalytics } = await import('../useAnalytics')
    const { result } = renderHook(() => useAnalytics())
    expect(typeof result.current.track).toBe('function')
    expect(typeof result.current.trackPage).toBe('function')
    expect(typeof result.current.setUserId).toBe('function')
  })
})
