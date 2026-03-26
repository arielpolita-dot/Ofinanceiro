/**
 * Firebase Analytics Provider
 *
 * Implementacao do AnalyticsProvider usando Firebase Analytics.
 */

import { initializeApp, FirebaseApp } from 'firebase/app'
import { getAnalytics, Analytics, logEvent, setUserId, setUserProperties } from 'firebase/analytics'
import type { AnalyticsProvider } from './analytics.interface'
import { logger } from '../../utils/logger'

export interface FirebaseConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
  measurementId: string
}

export class FirebaseAnalyticsProvider implements AnalyticsProvider {
  readonly name = 'Firebase'

  private app: FirebaseApp | null = null
  private analytics: Analytics | null = null
  private initialized = false

  constructor(private config: FirebaseConfig) {}

  init(): void {
    if (this.initialized) return

    // Skip if config has placeholder values
    if (!this.config.apiKey || this.config.apiKey.includes('Preencher')) {
      logger.analytics(`[Analytics:${this.name}] Skipped — config not set`)
      return
    }

    try {
      this.app = initializeApp(this.config)
      this.analytics = getAnalytics(this.app)
      this.initialized = true
      logger.analytics(`[Analytics:${this.name}] Initialized`)
    } catch (error) {
      logger.error(`[Analytics:${this.name}] Failed to initialize:`, error)
    }
  }

  trackPageView(pageName: string, pageUrl: string): void {
    if (!this.analytics) return

    logEvent(this.analytics, 'page_view', {
      page_title: pageName,
      page_location: pageUrl,
      page_path: pageUrl,
    })
  }

  trackEvent(eventName: string, eventParams?: Record<string, string | number | boolean>): void {
    if (!this.analytics) return

    logEvent(this.analytics, eventName, eventParams)
  }

  setUserId(userId: string): void {
    if (!this.analytics) return

    setUserId(this.analytics, userId)
  }

  setUserProperties(properties: Record<string, string>): void {
    if (!this.analytics) return

    setUserProperties(this.analytics, properties)
  }
}
