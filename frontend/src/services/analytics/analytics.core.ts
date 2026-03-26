/**
 * Analytics Core - Provider management, initialization, and base tracking functions.
 */

import type { AnalyticsProvider, EventParams } from './analytics.interface'
import { FirebaseAnalyticsProvider } from './firebase.provider'
import { UmamiAnalyticsProvider } from './umami.provider'
import { BackendAnalyticsProvider } from './backend.provider'
import { logger } from '../../utils/logger'

// ============================================================================
// Configuration — Replace placeholders with your Firebase project config
// ============================================================================

const FIREBASE_CONFIG = {
  apiKey: '{Preencher aqui}',
  authDomain: '{Preencher aqui}',
  projectId: '{Preencher aqui}',
  storageBucket: '{Preencher aqui}',
  messagingSenderId: '{Preencher aqui}',
  appId: '{Preencher aqui}',
  measurementId: '{Preencher aqui}',
}

// ============================================================================
// Provider Management
// ============================================================================

let providers: AnalyticsProvider[] = []
let initialized = false
let currentUserId: string | null = null
let userProperties: Record<string, string> = {}

/**
 * Cria os providers de analytics.
 * Backend provider envia para o banco de dados da aplicacao.
 * Firebase e Umami sao providers externos.
 */
function createProviders(): AnalyticsProvider[] {
  return [
    new BackendAnalyticsProvider(),
    new UmamiAnalyticsProvider(),
    new FirebaseAnalyticsProvider(FIREBASE_CONFIG),
  ]
}

/**
 * Inicializa todos os providers de analytics.
 */
export function initAnalytics(): void {
  if (initialized) return

  providers = createProviders()

  for (const provider of providers) {
    try {
      provider.init()
    } catch (error) {
      logger.analytics(`Failed to init ${provider.name}:`, error)
    }
  }

  initialized = true
  logger.analytics(`Initialized ${providers.length} provider(s)`)
}

// ============================================================================
// Core Tracking Functions
// ============================================================================

/**
 * Rastreia page view em todos os providers.
 * @param pageName Nome da pagina (ex: 'dashboard', 'project_detail')
 * @param pageUrl URL opcional (default: window.location.pathname)
 */
export function trackPage(pageName: string, pageUrl?: string): void {
  const url = pageUrl || window.location.pathname

  for (const provider of providers) {
    try {
      provider.trackPageView(pageName, url)
    } catch (error) {
      logger.analytics(`${provider.name} trackPageView error:`, error)
    }
  }

  logger.analytics(`page_view_${pageName}`, { url })
}

// Alias para compatibilidade
export const trackPageView = trackPage

/**
 * Rastreia evento customizado em todos os providers.
 * Formato: categoria_acao_elemento
 *
 * @param eventName Nome do evento (ex: 'cta_click_start_scan')
 * @param eventParams Parametros adicionais
 */
export function track(eventName: string, eventParams?: EventParams): void {
  const payload: EventParams = {
    ...eventParams,
    ...userProperties,
  }

  // Add user_id only if set
  if (currentUserId) {
    payload.user_id = currentUserId
  }

  for (const provider of providers) {
    try {
      provider.trackEvent(eventName, payload)
    } catch (error) {
      logger.analytics(`${provider.name} trackEvent error:`, error)
    }
  }

  logger.analytics(eventName, payload)
}

// Alias para compatibilidade
export const trackEvent = track

// Alias para setAnalyticsUserId
export const setUserId = (userId: string) => setAnalyticsUserId(userId)

/**
 * Define user ID em todos os providers.
 */
export function setAnalyticsUserId(userId: string): void {
  currentUserId = userId

  for (const provider of providers) {
    try {
      provider.setUserId(userId)
    } catch (error) {
      logger.analytics(`${provider.name} setUserId error:`, error)
    }
  }

  logger.analytics(`User ID set: ${userId.substring(0, 8)}...`)
}

/**
 * Define propriedades do usuario em todos os providers.
 */
export function setAnalyticsUserProperties(properties: Record<string, string>): void {
  userProperties = { ...userProperties, ...properties }

  for (const provider of providers) {
    try {
      provider.setUserProperties(properties)
    } catch (error) {
      logger.analytics(`${provider.name} setUserProperties error:`, error)
    }
  }

  logger.analytics('User properties set:', Object.keys(properties))
}
