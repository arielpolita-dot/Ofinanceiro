import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockTrack = vi.fn()
vi.mock('./analytics.core', () => ({
  track: (...args: any[]) => mockTrack(...args),
}))

describe('analytics.unlock-errors', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('trackErrorApi', async () => { const m = await import('./analytics.unlock-errors'); m.trackErrorApi('/api', 500, 'err'); expect(mockTrack).toHaveBeenCalled() })
  it('trackErrorValidation', async () => { const m = await import('./analytics.unlock-errors'); m.trackErrorValidation('email', 'req'); expect(mockTrack).toHaveBeenCalled() })
  it('trackErrorAuth', async () => { const m = await import('./analytics.unlock-errors'); m.trackErrorAuth('expired'); expect(mockTrack).toHaveBeenCalled() })
  it('trackCtaClick', async () => { const m = await import('./analytics.unlock-errors'); m.trackCtaClick('signup', 'header'); expect(mockTrack).toHaveBeenCalled() })
  it('trackFeatureUse', async () => { const m = await import('./analytics.unlock-errors'); m.trackFeatureUse('scan'); expect(mockTrack).toHaveBeenCalled() })
  it('trackNavClick', async () => { const m = await import('./analytics.unlock-errors'); m.trackNavClick('home', 'sidebar'); expect(mockTrack).toHaveBeenCalled() })
  it('trackFormStartFeedback', async () => { const m = await import('./analytics.unlock-errors'); m.trackFormStartFeedback(); expect(mockTrack).toHaveBeenCalled() })
  it('trackFormSubmitFeedback', async () => { const m = await import('./analytics.unlock-errors'); m.trackFormSubmitFeedback('bug'); expect(mockTrack).toHaveBeenCalled() })
  it('trackFeatureScheduleCreate', async () => { const m = await import('./analytics.unlock-errors'); m.trackFeatureScheduleCreate('id', 'daily'); expect(mockTrack).toHaveBeenCalled() })
  it('trackFeatureScheduleUpdate', async () => { const m = await import('./analytics.unlock-errors'); m.trackFeatureScheduleUpdate('id', 'weekly'); expect(mockTrack).toHaveBeenCalled() })
  it('trackFeatureScheduleDelete', async () => { const m = await import('./analytics.unlock-errors'); m.trackFeatureScheduleDelete('id'); expect(mockTrack).toHaveBeenCalled() })
})
