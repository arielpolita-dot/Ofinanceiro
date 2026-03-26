import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockTrack = vi.fn()
vi.mock('./analytics.core', () => ({
  track: (...args: any[]) => mockTrack(...args),
  trackPageView: vi.fn(),
}))

describe('analytics.funnel', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('trackFunnelTrialPageView', async () => { const m = await import('./analytics.funnel'); m.trackFunnelTrialPageView(); expect(mockTrack).toHaveBeenCalled() })
  it('trackFunnelTrialFormStart', async () => { const m = await import('./analytics.funnel'); m.trackFunnelTrialFormStart('email'); expect(mockTrack).toHaveBeenCalled() })
  it('trackFunnelTrialFormSubmit', async () => { const m = await import('./analytics.funnel'); m.trackFunnelTrialFormSubmit(true); expect(mockTrack).toHaveBeenCalled() })
  it('trackFunnelTrialStarted', async () => { const m = await import('./analytics.funnel'); m.trackFunnelTrialStarted('id'); expect(mockTrack).toHaveBeenCalled() })
  it('trackFunnelTrialResultView', async () => { const m = await import('./analytics.funnel'); m.trackFunnelTrialResultView('id', 5); expect(mockTrack).toHaveBeenCalled() })
  it('trackFunnelTrialClickRegister', async () => { const m = await import('./analytics.funnel'); m.trackFunnelTrialClickRegister('id'); expect(mockTrack).toHaveBeenCalled() })
  it('trackFunnelTrialClickLogin', async () => { const m = await import('./analytics.funnel'); m.trackFunnelTrialClickLogin('id'); expect(mockTrack).toHaveBeenCalled() })
  it('trackFunnelTrialClickRetry', async () => { const m = await import('./analytics.funnel'); m.trackFunnelTrialClickRetry('id'); expect(mockTrack).toHaveBeenCalled() })
  it('trackNavDashboardRefresh', async () => { const m = await import('./analytics.funnel'); m.trackNavDashboardRefresh(); expect(mockTrack).toHaveBeenCalled() })
  it('trackNavDashboardNewProject', async () => { const m = await import('./analytics.funnel'); m.trackNavDashboardNewProject(); expect(mockTrack).toHaveBeenCalled() })
  it('trackNavDashboardViewAll', async () => { const m = await import('./analytics.funnel'); m.trackNavDashboardViewAll(); expect(mockTrack).toHaveBeenCalled() })
  it('trackNavDashboardProject', async () => { const m = await import('./analytics.funnel'); m.trackNavDashboardProject('id', 'name'); expect(mockTrack).toHaveBeenCalled() })
  it('trackCtaFeedbackNewIssue', async () => { const m = await import('./analytics.funnel'); m.trackCtaFeedbackNewIssue(); expect(mockTrack).toHaveBeenCalled() })
  it('trackCtaFeedbackNewSuggestion', async () => { const m = await import('./analytics.funnel'); m.trackCtaFeedbackNewSuggestion(); expect(mockTrack).toHaveBeenCalled() })
  it('trackNavFeedbackTab', async () => { const m = await import('./analytics.funnel'); m.trackNavFeedbackTab('tab'); expect(mockTrack).toHaveBeenCalled() })
  it('trackFeatureFeedbackSubmit', async () => { const m = await import('./analytics.funnel'); m.trackFeatureFeedbackSubmit('bug', 'proj'); expect(mockTrack).toHaveBeenCalled() })
  it('trackFeatureFeedbackDelete', async () => { const m = await import('./analytics.funnel'); m.trackFeatureFeedbackDelete('id'); expect(mockTrack).toHaveBeenCalled() })
  it('trackEmailLinkClicked', async () => { const m = await import('./analytics.funnel'); m.trackEmailLinkClicked('campaign'); expect(mockTrack).toHaveBeenCalled() })
})
