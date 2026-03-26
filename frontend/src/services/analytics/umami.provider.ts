/**
 * Umami Analytics Provider
 *
 * Implementacao do AnalyticsProvider usando Umami.
 * Umami e carregado via script tag no HTML, este provider apenas usa a API global.
 */

import type { AnalyticsProvider } from './analytics.interface'
import { logger } from '../../utils/logger'

// Umami global type
declare global {
  interface Window {
    umami?: {
      track: (eventName: string, eventData?: Record<string, unknown>) => void
    }
  }
}

export class UmamiAnalyticsProvider implements AnalyticsProvider {
  readonly name = 'Umami'

  init(): void {
    // Umami e inicializado automaticamente via script tag no HTML
    // Apenas verificamos se esta disponivel
    if (window.umami) {
      logger.analytics(`${this.name} initialized (script already loaded)`)
    } else {
      logger.analytics(`${this.name} script not loaded yet, will use when available`)
    }
  }

  trackPageView(pageName: string, pageUrl: string): void {
    if (!window.umami) return

    window.umami.track('pageview', { page: pageName, url: pageUrl })
  }

  trackEvent(eventName: string, eventParams?: Record<string, string | number | boolean>): void {
    if (!window.umami) return

    window.umami.track(eventName, eventParams)
  }

  setUserId(_userId: string): void {
    // Umami nao suporta user ID nativamente
    // Pode-se passar como propriedade em eventos se necessario
  }

  setUserProperties(_properties: Record<string, string>): void {
    // Umami nao suporta user properties nativamente
  }
}
