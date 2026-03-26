/**
 * Analytics Funnel - Convenience functions for Trial, Dashboard,
 * Feedback, and Email tracking.
 */

import type { EventParams } from './analytics.interface'
import { track } from './analytics.core'
import { AnalyticsEvents } from './analytics.events'

// -------------------------------------------------------------------------
// TRIAL FUNNEL
// -------------------------------------------------------------------------

export function trackFunnelTrialPageView(): void {
  track(AnalyticsEvents.FUNNEL_TRIAL_PAGE_VIEW)
}

export function trackFunnelTrialFormStart(firstField: string): void {
  track(AnalyticsEvents.FUNNEL_TRIAL_FORM_START, { first_field: firstField })
}

export function trackFunnelTrialFormSubmit(hasBackend: boolean): void {
  track(AnalyticsEvents.FUNNEL_TRIAL_FORM_SUBMIT, { has_backend: hasBackend })
}

export function trackFunnelTrialStarted(trialId: string): void {
  track(AnalyticsEvents.FUNNEL_TRIAL_STARTED, { trial_id: trialId })
}

export function trackFunnelTrialResultView(trialId: string, resultCount: number): void {
  track(AnalyticsEvents.FUNNEL_TRIAL_RESULT_VIEW, {
    trial_id: trialId,
    result_count: resultCount,
  })
}

export function trackFunnelTrialClickRegister(trialId: string): void {
  track(AnalyticsEvents.FUNNEL_TRIAL_CLICK_REGISTER, { trial_id: trialId })
}

export function trackFunnelTrialClickLogin(trialId: string): void {
  track(AnalyticsEvents.FUNNEL_TRIAL_CLICK_LOGIN, { trial_id: trialId })
}

export function trackFunnelTrialClickRetry(trialId?: string): void {
  const params: EventParams = {}
  if (trialId) params.trial_id = trialId
  track(AnalyticsEvents.FUNNEL_TRIAL_CLICK_RETRY, params)
}

// Aliases para compatibilidade
export const trackTrialStart = (url: string) =>
  track(AnalyticsEvents.FUNNEL_TRIAL_FORM_SUBMIT, { target_url: url })
export const trackTrialComplete = (trialId: string, count: number) =>
  trackFunnelTrialResultView(trialId, count)

// -------------------------------------------------------------------------
// DASHBOARD
// -------------------------------------------------------------------------

export function trackNavDashboardRefresh(): void {
  track(AnalyticsEvents.NAV_CLICK_DASHBOARD_REFRESH)
}

export function trackNavDashboardNewProject(): void {
  track(AnalyticsEvents.NAV_CLICK_DASHBOARD_NEW_PROJECT)
}

export function trackNavDashboardViewAll(): void {
  track(AnalyticsEvents.NAV_CLICK_DASHBOARD_VIEW_ALL)
}

export function trackNavDashboardProject(projectId: string, projectName?: string): void {
  const params: EventParams = { project_id: projectId }
  if (projectName) params.project_name = projectName
  track(AnalyticsEvents.NAV_CLICK_DASHBOARD_PROJECT, params)
}

// -------------------------------------------------------------------------
// FEEDBACK
// -------------------------------------------------------------------------

export function trackCtaFeedbackNewIssue(): void {
  track(AnalyticsEvents.CTA_CLICK_FEEDBACK_NEW_ISSUE)
}

export function trackCtaFeedbackNewSuggestion(): void {
  track(AnalyticsEvents.CTA_CLICK_FEEDBACK_NEW_SUGGESTION)
}

export function trackNavFeedbackTab(tab: string): void {
  track(AnalyticsEvents.NAV_CLICK_FEEDBACK_TAB, { tab })
}

export function trackFeatureFeedbackSubmit(type: string, projectId?: string): void {
  const params: EventParams = { feedback_type: type }
  if (projectId) params.project_id = projectId
  track(AnalyticsEvents.FEATURE_FEEDBACK_SUBMIT, params)
}

export function trackFeatureFeedbackDelete(feedbackId: string): void {
  track(AnalyticsEvents.FEATURE_FEEDBACK_DELETE, { feedback_id: feedbackId })
}

// -------------------------------------------------------------------------
// EMAIL
// -------------------------------------------------------------------------

export function trackEmailLinkClicked(emailType: string): void {
  track(AnalyticsEvents.EMAIL_LINK_CLICKED, { email_type: emailType })
}
