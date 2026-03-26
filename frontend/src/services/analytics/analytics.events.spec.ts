import { describe, it, expect } from 'vitest'
import { AnalyticsEvents } from './analytics.events'

describe('AnalyticsEvents', () => {
  it('exports event constants as an object', () => {
    expect(typeof AnalyticsEvents).toBe('object')
    expect(Object.keys(AnalyticsEvents).length).toBeGreaterThan(0)
  })

  it('has page view events', () => {
    expect(AnalyticsEvents.PAGE_VIEW_DASHBOARD).toBe('page_view_dashboard')
    expect(AnalyticsEvents.PAGE_VIEW_PROJECTS).toBe('page_view_projects')
    expect(AnalyticsEvents.PAGE_VIEW_PLANS).toBe('page_view_plans')
  })

  it('has auth events', () => {
    expect(AnalyticsEvents.AUTH_LOGIN_START).toBe('auth_login_start')
    expect(AnalyticsEvents.AUTH_LOGIN_SUCCESS).toBe('auth_login_success')
    expect(AnalyticsEvents.AUTH_LOGOUT).toBe('auth_logout')
  })

  it('has navigation events', () => {
    expect(AnalyticsEvents.NAV_CLICK_SIDEBAR).toBe('nav_click_sidebar')
    expect(AnalyticsEvents.NAV_CLICK_PROJECT).toBe('nav_click_project')
  })

  it('has CTA events', () => {
    expect(AnalyticsEvents.CTA_CLICK_NEW_PROJECT).toBe('cta_click_new_project')
    expect(AnalyticsEvents.CTA_CLICK_BUY_CREDITS).toBe('cta_click_buy_credits')
  })

  it('has conversion events', () => {
    expect(AnalyticsEvents.CONVERSION_CHECKOUT_START).toBe('conversion_checkout_start')
    expect(AnalyticsEvents.CONVERSION_PAYMENT_SUCCESS).toBe('conversion_payment_success')
  })

  it('has error events', () => {
    expect(AnalyticsEvents.ERROR_API).toBe('error_api')
    expect(AnalyticsEvents.ERROR_VALIDATION).toBe('error_validation')
    expect(AnalyticsEvents.ERROR_UNKNOWN).toBe('error_unknown')
  })

  it('has funnel events', () => {
    expect(AnalyticsEvents.FUNNEL_TRIAL_PAGE_VIEW).toBe('funnel_trial_page_view')
    expect(AnalyticsEvents.FUNNEL_TRIAL_FORM_SUBMIT).toBe('funnel_trial_form_submit')
  })

  it('all values follow snake_case convention', () => {
    for (const [key, value] of Object.entries(AnalyticsEvents)) {
      expect(value).toMatch(/^[a-z][a-z0-9_]*$/)
      // Key should be UPPER_SNAKE_CASE
      expect(key).toMatch(/^[A-Z][A-Z0-9_]*$/)
    }
  })
})
