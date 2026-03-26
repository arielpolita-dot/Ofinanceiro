import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock logger before imports
const mockLogger = {
  analytics: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
}

vi.mock('../../utils/logger', () => ({
  logger: mockLogger,
}))

// Mock providers with proper class syntax
vi.mock('./firebase.provider', () => ({
  FirebaseAnalyticsProvider: class {
    name = 'Firebase'
    init = vi.fn()
    trackPageView = vi.fn()
    trackEvent = vi.fn()
    setUserId = vi.fn()
    setUserProperties = vi.fn()
  },
}))

vi.mock('./umami.provider', () => ({
  UmamiAnalyticsProvider: class {
    name = 'Umami'
    init = vi.fn()
    trackPageView = vi.fn()
    trackEvent = vi.fn()
    setUserId = vi.fn()
    setUserProperties = vi.fn()
  },
}))

vi.mock('./backend.provider', () => ({
  BackendAnalyticsProvider: class {
    name = 'Backend'
    init = vi.fn()
    trackPageView = vi.fn()
    trackEvent = vi.fn()
    setUserId = vi.fn()
    setUserProperties = vi.fn()
  },
}))

describe('analytics.core', () => {
  beforeEach(() => {
    vi.resetModules()
    mockLogger.analytics.mockClear()
    mockLogger.error.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('initAnalytics initializes all providers', async () => {
    const { initAnalytics } = await import('./analytics.core')
    initAnalytics()
    expect(mockLogger.analytics).toHaveBeenCalledWith(
      expect.stringContaining('Initialized 3 provider'),
    )
  })

  it('initAnalytics is idempotent (only initializes once)', async () => {
    const { initAnalytics } = await import('./analytics.core')
    initAnalytics()
    initAnalytics()
    const initCalls = mockLogger.analytics.mock.calls.filter(
      (call: unknown[]) => String(call[0]).includes('Initialized'),
    )
    expect(initCalls).toHaveLength(1)
  })

  it('track sends event to all providers', async () => {
    const { initAnalytics, track } = await import('./analytics.core')
    initAnalytics()
    track('cta_click_start', { page: 'home' })
    expect(mockLogger.analytics).toHaveBeenCalledWith(
      'cta_click_start',
      expect.objectContaining({ page: 'home' }),
    )
  })

  it('trackPage sends page view to all providers', async () => {
    const { initAnalytics, trackPage } = await import('./analytics.core')
    initAnalytics()
    trackPage('dashboard', '/dashboard')
    expect(mockLogger.analytics).toHaveBeenCalledWith(
      'page_view_dashboard',
      expect.objectContaining({ url: '/dashboard' }),
    )
  })

  it('trackPage uses window.location.pathname as default URL', async () => {
    const { initAnalytics, trackPage } = await import('./analytics.core')
    initAnalytics()
    trackPage('home')
    expect(mockLogger.analytics).toHaveBeenCalledWith(
      'page_view_home',
      expect.objectContaining({ url: window.location.pathname }),
    )
  })

  it('setAnalyticsUserId sets user across providers', async () => {
    const { initAnalytics, setAnalyticsUserId } = await import('./analytics.core')
    initAnalytics()
    setAnalyticsUserId('user-abc-123')
    expect(mockLogger.analytics).toHaveBeenCalledWith(
      expect.stringContaining('User ID set'),
    )
  })

  it('track includes userId when set', async () => {
    const { initAnalytics, setAnalyticsUserId, track } = await import('./analytics.core')
    initAnalytics()
    setAnalyticsUserId('user-123')
    track('some_event')
    const trackCall = mockLogger.analytics.mock.calls.find(
      (call: unknown[]) => String(call[0]).includes('some_event'),
    )
    expect(trackCall).toBeTruthy()
    expect(trackCall![1]).toHaveProperty('user_id', 'user-123')
  })

  it('setAnalyticsUserProperties merges properties', async () => {
    const { initAnalytics, setAnalyticsUserProperties } = await import('./analytics.core')
    initAnalytics()
    setAnalyticsUserProperties({ plan: 'pro' })
    expect(mockLogger.analytics).toHaveBeenCalledWith(
      'User properties set:',
      expect.arrayContaining(['plan']),
    )
  })

  it('exports aliases trackEvent, trackPageView, setUserId', async () => {
    const mod = await import('./analytics.core')
    expect(mod.trackEvent).toBe(mod.track)
    expect(mod.trackPageView).toBe(mod.trackPage)
    expect(typeof mod.setUserId).toBe('function')
  })

  it('handles provider init errors gracefully', async () => {
    vi.doMock('./backend.provider', () => ({
      BackendAnalyticsProvider: class {
        name = 'Backend'
        init() { throw new Error('init failed') }
        trackPageView = vi.fn()
        trackEvent = vi.fn()
        setUserId = vi.fn()
        setUserProperties = vi.fn()
      },
    }))

    vi.resetModules()
    const { initAnalytics } = await import('./analytics.core')

    expect(() => initAnalytics()).not.toThrow()
    expect(mockLogger.analytics).toHaveBeenCalledWith(
      expect.stringContaining('Failed to init'),
      expect.any(Error),
    )
  })
})
