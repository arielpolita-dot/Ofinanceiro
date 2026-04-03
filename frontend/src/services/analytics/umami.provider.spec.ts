import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UmamiAnalyticsProvider } from './umami.provider'

describe('UmamiAnalyticsProvider', () => {
  beforeEach(() => { (window as any).umami = { track: vi.fn() } })

  it('init works', () => {
    const p = new UmamiAnalyticsProvider()
    p.init()
  })
  it('trackPageView calls umami.track', () => {
    const p = new UmamiAnalyticsProvider(); p.init()
    p.trackPageView('home', '/home')
    expect((window as any).umami.track).toHaveBeenCalledWith('pageview', { page: 'home', url: '/home' })
  })
  it('trackEvent calls umami.track', () => {
    const p = new UmamiAnalyticsProvider(); p.init()
    p.trackEvent('click', { btn: 'signup' })
    expect((window as any).umami.track).toHaveBeenCalledWith('click', { btn: 'signup' })
  })
  it('setUserId is a no-op', () => {
    const p = new UmamiAnalyticsProvider()
    p.setUserId('user-1')
  })
  it('setUserProperties is a no-op', () => {
    const p = new UmamiAnalyticsProvider()
    p.setUserProperties({ plan: 'pro' })
  })
})
