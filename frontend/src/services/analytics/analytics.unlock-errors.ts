/**
 * Analytics Errors, CTA/Engagement, Feedback forms, and Scheduling.
 */

import { track } from './analytics.core'
import { AnalyticsEvents } from './analytics.events'

// -------------------------------------------------------------------------
// ERRORS
// -------------------------------------------------------------------------

export function trackErrorApi(endpoint: string, status: number, message: string): void {
  track(AnalyticsEvents.ERROR_API, {
    endpoint,
    status,
    message: message.substring(0, 100),
  })
}

export function trackErrorValidation(field: string, message: string): void {
  track(AnalyticsEvents.ERROR_VALIDATION, {
    field,
    message: message.substring(0, 100),
  })
}

export function trackErrorAuth(error: string): void {
  track(AnalyticsEvents.ERROR_AUTH, { error: error.substring(0, 100) })
}

// Alias para compatibilidade
export const trackError = (errorType: string, errorMessage: string, context?: string) =>
  track(AnalyticsEvents.ERROR_UNKNOWN, {
    error_type: errorType,
    error_message: errorMessage.substring(0, 100),
    context: context || 'unknown',
  })

// -------------------------------------------------------------------------
// CTA / ENGAGEMENT
// -------------------------------------------------------------------------

export function trackCtaClick(ctaName: string, location: string): void {
  track(`cta_click_${ctaName}`, { location })
}

export function trackFeatureUse(featureName: string, details?: Record<string, string | number>): void {
  track(`feature_use_${featureName}`, details)
}

export function trackNavClick(destination: string, source: string): void {
  track(`nav_click_${destination}`, { source })
}

// -------------------------------------------------------------------------
// FEEDBACK
// -------------------------------------------------------------------------

export function trackFormStartFeedback(): void {
  track(AnalyticsEvents.FORM_START_FEEDBACK)
}

export function trackFormSubmitFeedback(type: string): void {
  track(AnalyticsEvents.FORM_SUBMIT_FEEDBACK, { feedback_type: type })
}

// -------------------------------------------------------------------------
// SCHEDULING
// -------------------------------------------------------------------------

export function trackFeatureScheduleCreate(projectId: string, frequency: string): void {
  track(AnalyticsEvents.FEATURE_SCHEDULE_CREATE, {
    project_id: projectId,
    frequency,
  })
}

export function trackFeatureScheduleUpdate(projectId: string, frequency: string): void {
  track(AnalyticsEvents.FEATURE_SCHEDULE_UPDATE, {
    project_id: projectId,
    frequency,
  })
}

export function trackFeatureScheduleDelete(projectId: string): void {
  track(AnalyticsEvents.FEATURE_SCHEDULE_DELETE, { project_id: projectId })
}
