import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockTrack = vi.fn()
vi.mock('./analytics.core', () => ({
  track: (...args: any[]) => mockTrack(...args),
}))

describe('analytics.tracking', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('trackAuthLoginStart', async () => { const m = await import('./analytics.tracking'); m.trackAuthLoginStart(); expect(mockTrack).toHaveBeenCalled() })
  it('trackAuthLoginSuccess', async () => { const m = await import('./analytics.tracking'); m.trackAuthLoginSuccess(); expect(mockTrack).toHaveBeenCalled() })
  it('trackAuthLoginError', async () => { const m = await import('./analytics.tracking'); m.trackAuthLoginError('err'); expect(mockTrack).toHaveBeenCalled() })
  it('trackAuthLogout', async () => { const m = await import('./analytics.tracking'); m.trackAuthLogout(); expect(mockTrack).toHaveBeenCalled() })
  it('trackFeatureProjectCreate', async () => { const m = await import('./analytics.tracking'); m.trackFeatureProjectCreate('id', 'name'); expect(mockTrack).toHaveBeenCalled() })
  it('trackFeatureProjectUpdate', async () => { const m = await import('./analytics.tracking'); m.trackFeatureProjectUpdate('id'); expect(mockTrack).toHaveBeenCalled() })
  it('trackFeatureProjectDelete', async () => { const m = await import('./analytics.tracking'); m.trackFeatureProjectDelete('id'); expect(mockTrack).toHaveBeenCalled() })
  it('trackCtaClickNewProject', async () => { const m = await import('./analytics.tracking'); m.trackCtaClickNewProject(); expect(mockTrack).toHaveBeenCalled() })
  it('trackCtaClickSelectPlan', async () => { const m = await import('./analytics.tracking'); m.trackCtaClickSelectPlan('id', 'name'); expect(mockTrack).toHaveBeenCalled() })
  it('trackConversionCheckoutStart', async () => { const m = await import('./analytics.tracking'); m.trackConversionCheckoutStart('id', 'name', 10); expect(mockTrack).toHaveBeenCalled() })
  it('trackConversionCheckoutSuccess', async () => { const m = await import('./analytics.tracking'); m.trackConversionCheckoutSuccess('id', 'name', 10); expect(mockTrack).toHaveBeenCalled() })
  it('trackCtaClickBuyCredits', async () => { const m = await import('./analytics.tracking'); m.trackCtaClickBuyCredits('pkg'); expect(mockTrack).toHaveBeenCalled() })
  it('trackConversionPaymentConfirmed', async () => { const m = await import('./analytics.tracking'); m.trackConversionPaymentConfirmed('id', 'name', 10); expect(mockTrack).toHaveBeenCalled() })
  it('trackConversionPaymentSuccess', async () => { const m = await import('./analytics.tracking'); m.trackConversionPaymentSuccess('id', 'name', 10); expect(mockTrack).toHaveBeenCalled() })
  it('trackNavClickProject', async () => { const m = await import('./analytics.tracking'); m.trackNavClickProject('id'); expect(mockTrack).toHaveBeenCalled() })
})

