/**
 * Analytics Provider Interface
 *
 * Interface para inversao de dependencia - permite trocar o provider
 * de analytics (Firebase, Mixpanel, Amplitude, etc.) sem alterar o resto do codigo.
 */

export interface AnalyticsProvider {
  /** Nome do provider (para logs) */
  readonly name: string

  /** Inicializa o provider */
  init(): void

  /** Rastreia page view */
  trackPageView(pageName: string, pageUrl: string): void

  /** Rastreia evento customizado */
  trackEvent(eventName: string, eventParams?: Record<string, string | number | boolean>): void

  /** Define user ID para tracking */
  setUserId(userId: string): void

  /** Define propriedades do usuario */
  setUserProperties(properties: Record<string, string>): void
}

export type EventParams = Record<string, string | number | boolean>
