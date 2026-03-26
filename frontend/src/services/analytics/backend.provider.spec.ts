import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { BackendAnalyticsProvider } from './backend.provider'

// Mock the logger
vi.mock('../../utils/logger', () => ({
  logger: {
    analytics: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}))

// Mock the useUtmParams module
vi.mock('../../hooks/useUtmParams', () => ({
  getStoredUtmParams: vi.fn(() => ({
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_content: null,
    utm_term: null,
  })),
}))

import { logger } from '../../utils/logger'

describe('BackendAnalyticsProvider', () => {
  let provider: BackendAnalyticsProvider
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    provider = new BackendAnalyticsProvider()
    vi.stubGlobal('fetch', vi.fn())
    vi.useFakeTimers()
    localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    globalThis.fetch = originalFetch
  })

  it('has name "Backend"', () => {
    expect(provider.name).toBe('Backend')
  })

  it('init logs initialization', () => {
    provider.init()
    expect(logger.analytics).toHaveBeenCalledWith(expect.stringContaining('initialized'))
  })

  describe('trackPageView', () => {
    it('sends POST to /activity/track/pageview with credentials include', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(new Response('', { status: 200 }))

      provider.trackPageView('dashboard', '/dashboard')

      // fire-and-forget, wait for microtask
      await vi.runAllTimersAsync()

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/activity/track/pageview'),
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        }),
      )
    })

    it('uses cookies instead of Authorization header', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(new Response('', { status: 200 }))

      provider.trackPageView('home', '/')

      await vi.runAllTimersAsync()

      const callArgs = vi.mocked(fetch).mock.calls[0]
      const options = callArgs[1] as RequestInit
      expect(options.credentials).toBe('include')
      const headers = options.headers as Record<string, string>
      expect(headers.Authorization).toBeUndefined()
    })
  })

  describe('trackEvent', () => {
    it('sends POST to /activity/track with event data', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(new Response('', { status: 200 }))

      provider.trackEvent('cta_click_start_scan', { project_id: 'p-1' })

      await vi.runAllTimersAsync()

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/activity/track'),
        expect.objectContaining({ method: 'POST' }),
      )

      const body = JSON.parse(
        (vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string,
      )
      expect(body.eventName).toBe('cta_click_start_scan')
      expect(body.params.project_id).toBe('p-1')
    })

    it('extracts category from known event prefixes', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(new Response('', { status: 200 }))

      provider.trackEvent('funnel_trial_page_view')

      await vi.runAllTimersAsync()

      const body = JSON.parse(
        (vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string,
      )
      expect(body.category).toBe('funnel')
    })

    it('uses "other" category for unknown prefixes', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(new Response('', { status: 200 }))

      provider.trackEvent('custom_something')

      await vi.runAllTimersAsync()

      const body = JSON.parse(
        (vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string,
      )
      expect(body.category).toBe('other')
    })

    it('marks error events with success=false', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(new Response('', { status: 200 }))

      provider.trackEvent('error_api', { message: 'Server 500' })

      await vi.runAllTimersAsync()

      const body = JSON.parse(
        (vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string,
      )
      expect(body.success).toBe(false)
      expect(body.errorMessage).toBe('Server 500')
    })

    it('marks non-error events with success=true', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(new Response('', { status: 200 }))

      provider.trackEvent('cta_click_buy')

      await vi.runAllTimersAsync()

      const body = JSON.parse(
        (vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string,
      )
      expect(body.success).toBe(true)
      expect(body.errorMessage).toBeUndefined()
    })
  })

  describe('setUserId / setUserProperties', () => {
    it('setUserId is a no-op (backend uses token)', () => {
      expect(() => provider.setUserId('user-1')).not.toThrow()
    })

    it('setUserProperties is a no-op (backend uses token)', () => {
      expect(() => provider.setUserProperties({ plan: 'pro' })).not.toThrow()
    })
  })
})
