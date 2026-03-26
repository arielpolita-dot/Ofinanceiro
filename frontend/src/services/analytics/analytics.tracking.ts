/**
 * Analytics Tracking - Convenience functions for Auth, Projects, and Billing.
 */

import type { EventParams } from './analytics.interface'
import { track } from './analytics.core'
import { AnalyticsEvents } from './analytics.events'

// -------------------------------------------------------------------------
// AUTH
// -------------------------------------------------------------------------

export function trackAuthLoginStart(method: string = 'google'): void {
  track(AnalyticsEvents.AUTH_LOGIN_START, { method })
}

export function trackAuthLoginSuccess(method: string = 'google'): void {
  track(AnalyticsEvents.AUTH_LOGIN_SUCCESS, { method })
}

export function trackAuthLoginError(error: string): void {
  track(AnalyticsEvents.AUTH_LOGIN_ERROR, { error: error.substring(0, 100) })
}

export function trackAuthLogout(): void {
  track(AnalyticsEvents.AUTH_LOGOUT)
}

// Aliases para compatibilidade
export const trackLogin = (method?: string) => trackAuthLoginSuccess(method)
export const trackLogout = trackAuthLogout

// -------------------------------------------------------------------------
// PROJECTS
// -------------------------------------------------------------------------

export function trackFeatureProjectCreate(projectId: string, projectName: string): void {
  track(AnalyticsEvents.FEATURE_PROJECT_CREATE, {
    project_id: projectId,
    project_name: projectName,
  })
}

export function trackFeatureProjectUpdate(projectId: string, projectName?: string): void {
  const params: EventParams = { project_id: projectId }
  if (projectName) params.project_name = projectName
  track(AnalyticsEvents.FEATURE_PROJECT_UPDATE, params)
}

export function trackFeatureProjectDelete(projectId: string, projectName?: string): void {
  const params: EventParams = { project_id: projectId }
  if (projectName) params.project_name = projectName
  track(AnalyticsEvents.FEATURE_PROJECT_DELETE, params)
}

export function trackNavClickProject(projectId: string, projectName?: string): void {
  const params: EventParams = { project_id: projectId }
  if (projectName) params.project_name = projectName
  track(AnalyticsEvents.NAV_CLICK_PROJECT, params)
}

export function trackCtaClickNewProject(): void {
  track(AnalyticsEvents.CTA_CLICK_NEW_PROJECT)
}

// Aliases para compatibilidade
export const trackProjectCreate = trackFeatureProjectCreate
export const trackProjectView = trackNavClickProject

// -------------------------------------------------------------------------
// BILLING / CONVERSION
// -------------------------------------------------------------------------

export function trackCtaClickSelectPlan(planId: string, planName: string): void {
  track(AnalyticsEvents.CTA_CLICK_SELECT_PLAN, {
    plan_id: planId,
    plan_name: planName,
  })
}

export function trackConversionCheckoutStart(
  type: 'plan' | 'credits',
  itemId: string,
  value: number
): void {
  track(AnalyticsEvents.CONVERSION_CHECKOUT_START, {
    checkout_type: type,
    item_id: itemId,
    value,
    currency: 'BRL',
  })
}

export function trackConversionCheckoutSuccess(
  type: 'plan' | 'credits',
  itemId: string,
  value: number
): void {
  track(AnalyticsEvents.CONVERSION_CHECKOUT_SUCCESS, {
    checkout_type: type,
    item_id: itemId,
    value,
    currency: 'BRL',
  })
}

export function trackCtaClickBuyCredits(packageId: string): void {
  track(AnalyticsEvents.CTA_CLICK_BUY_CREDITS, { package_id: packageId })
}

export function trackConversionPaymentConfirmed(
  value: number,
  currency: string = 'BRL',
  confirmationSource: string = 'billing_api'
): void {
  track(AnalyticsEvents.CONVERSION_PAYMENT_CONFIRMED, {
    value,
    currency,
    confirmation_source: confirmationSource,
  })
}

export function trackConversionPaymentSuccess(
  value: number,
  currency: string = 'BRL'
): void {
  track(AnalyticsEvents.CONVERSION_PAYMENT_SUCCESS, {
    value,
    currency,
  })
}

// Aliases para compatibilidade
export const trackPlanSelect = (planId: string, planName: string) =>
  trackCtaClickSelectPlan(planId, planName)
export const trackCheckoutStart = (planId: string, value: number) =>
  trackConversionCheckoutStart('plan', planId, value)
export const trackCheckoutComplete = (planId: string, value: number) =>
  trackConversionCheckoutSuccess('plan', planId, value)
