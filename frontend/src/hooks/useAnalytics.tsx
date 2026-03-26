/**
 * useAnalytics - React hook for analytics tracking
 *
 * Provides automatic page view tracking and core analytics functions.
 * For convenience tracking functions (trackAuthLogout, trackCtaClick, etc.),
 * import them directly from 'services/analytics'.
 */

import { useEffect, useCallback, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import {
  initAnalytics,
  trackPage,
  track,
  setAnalyticsUserId,
  setAnalyticsUserProperties,
  AnalyticsEvents,
} from '../services/analytics'

// ============================================================================
// Page Name Mapping - Padrao: snake_case
// ============================================================================

const PAGE_NAMES: Record<string, string> = {
  '/': 'companies',
  '/companies': 'companies',
  '/plans': 'plans',
  '/settings': 'settings',
  '/auth/callback': 'auth_callback',
}

function getPageName(pathname: string): string {
  if (PAGE_NAMES[pathname]) {
    return PAGE_NAMES[pathname]
  }

  if (pathname.startsWith('/projects/') && pathname.includes('/reports/')) {
    return 'report_detail'
  }
  if (pathname.startsWith('/projects/')) {
    return 'project_detail'
  }
  if (pathname.startsWith('/trial/') && pathname.includes('/result')) {
    return 'trial_result'
  }

  return 'unknown'
}

// ============================================================================
// Core Hooks
// ============================================================================

/**
 * Hook to track page views automatically.
 * Call this once in your App or Layout component.
 */
export function usePageTracking(): void {
  const location = useLocation()
  const prevPathRef = useRef<string>('')

  useEffect(() => {
    if (prevPathRef.current === location.pathname) return
    prevPathRef.current = location.pathname

    const pageName = getPageName(location.pathname)
    trackPage(pageName, location.pathname + location.search)
  }, [location])
}

/**
 * Hook to initialize analytics.
 * Call this once at app startup.
 */
export function useAnalyticsInit(): void {
  useEffect(() => {
    initAnalytics()
  }, [])
}

// ============================================================================
// Main Hook
// ============================================================================

/**
 * Combined hook for analytics setup with core tracking functions.
 * For convenience functions, import directly from 'services/analytics'.
 */
export function useAnalytics() {
  useAnalyticsInit()
  usePageTracking()

  const trackPageCallback = useCallback(trackPage, [])
  const trackCallback = useCallback(track, [])

  return {
    track: trackCallback,
    trackPage: trackPageCallback,
    setUserId: setAnalyticsUserId,
    setUserProperties: setAnalyticsUserProperties,
    events: AnalyticsEvents,
  }
}

export { AnalyticsEvents }
