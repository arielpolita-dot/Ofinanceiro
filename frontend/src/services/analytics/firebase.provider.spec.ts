import { describe, it, expect, vi } from 'vitest'

vi.mock('firebase/app', () => ({ initializeApp: vi.fn(() => ({})) }))
vi.mock('firebase/analytics', () => ({
  getAnalytics: vi.fn(() => ({})),
  logEvent: vi.fn(),
  setUserId: vi.fn(),
  setUserProperties: vi.fn(),
}))

describe('FirebaseAnalyticsProvider', () => {
  const cfg = { apiKey: 'k', authDomain: 'd', projectId: 'p', storageBucket: 's', messagingSenderId: 'm', appId: 'a', measurementId: 'G-TEST' }

  it('init initializes firebase', async () => {
    const { FirebaseAnalyticsProvider } = await import('./firebase.provider')
    const p = new FirebaseAnalyticsProvider(cfg)
    p.init()
  })
  it('trackPageView calls logEvent', async () => {
    const fa = await import('firebase/analytics')
    const { FirebaseAnalyticsProvider } = await import('./firebase.provider')
    const p = new FirebaseAnalyticsProvider(cfg); p.init()
    p.trackPageView('home', '/home')
    expect(fa.logEvent).toHaveBeenCalled()
  })
  it('trackEvent calls logEvent', async () => {
    const fa = await import('firebase/analytics')
    const { FirebaseAnalyticsProvider } = await import('./firebase.provider')
    const p = new FirebaseAnalyticsProvider(cfg); p.init()
    p.trackEvent('click', { btn: 'signup' })
    expect(fa.logEvent).toHaveBeenCalled()
  })
  it('setUserId calls firebase setUserId', async () => {
    const fa = await import('firebase/analytics')
    const { FirebaseAnalyticsProvider } = await import('./firebase.provider')
    const p = new FirebaseAnalyticsProvider(cfg); p.init()
    p.setUserId('user-1')
    expect(fa.setUserId).toHaveBeenCalled()
  })
  it('setUserProperties calls firebase', async () => {
    const fa = await import('firebase/analytics')
    const { FirebaseAnalyticsProvider } = await import('./firebase.provider')
    const p = new FirebaseAnalyticsProvider(cfg); p.init()
    p.setUserProperties({ plan: 'pro' })
    expect(fa.setUserProperties).toHaveBeenCalled()
  })
})
