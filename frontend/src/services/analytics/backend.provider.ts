/**
 * Backend Analytics Provider
 *
 * Envia eventos de analytics para o backend da aplicacao,
 * onde sao salvos na tabela app_activity_logs.
 *
 * Este provider funciona tanto para usuarios logados quanto deslogados.
 *
 * Suporta UTM parameters para tracking de campanhas:
 * - utm_source: origem do trafego (meta, google, email)
 * - utm_medium: meio de marketing (retargeting, cpc, organic)
 * - utm_campaign: nome da campanha (video_v5, black_friday)
 * - utm_content: variacao do anuncio (opcional)
 * - utm_term: termo de busca (opcional)
 */

import type { AnalyticsProvider } from './analytics.interface'
import { getStoredUtmParams } from '../../hooks/useUtmParams'
import { logger } from '../../utils/logger'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const MAX_QUEUE_SIZE = 100

// Queue para eventos que falham (retry later)
let eventQueue: Array<{ type: 'event' | 'pageview'; data: unknown }> = []
let isProcessingQueue = false
let queueIntervalId: ReturnType<typeof setInterval> | null = null

/**
 * Tenta enviar eventos da fila
 */
async function processQueue(): Promise<void> {
  if (isProcessingQueue || eventQueue.length === 0) return

  isProcessingQueue = true

  while (eventQueue.length > 0) {
    const item = eventQueue[0]
    try {
      if (item.type === 'event') {
        await sendEventToBackend(item.data as TrackEventPayload)
      } else {
        await sendPageViewToBackend(item.data as TrackPageViewPayload)
      }
      eventQueue.shift() // Remove da fila se sucesso
    } catch {
      // Se falhar, para de processar e tenta de novo mais tarde
      break
    }
  }

  isProcessingQueue = false
}

/**
 * Adiciona item na fila, descartando o mais antigo se cheia
 */
function enqueue(item: { type: 'event' | 'pageview'; data: unknown }): void {
  if (eventQueue.length >= MAX_QUEUE_SIZE) {
    eventQueue.shift() // Drop oldest
  }
  eventQueue.push(item)
}

interface UtmData {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
}

interface TrackEventPayload {
  eventName: string
  category?: string
  params?: Record<string, string | number | boolean>
  pageUrl?: string
  pageName?: string
  resourceId?: string
  resourceName?: string
  success?: boolean
  errorMessage?: string
  utm?: UtmData
}

interface TrackPageViewPayload {
  pageName: string
  pageUrl?: string
  utm?: UtmData
}

/**
 * Envia evento para o backend
 */
async function sendEventToBackend(payload: TrackEventPayload): Promise<void> {
  const response = await fetch(`${API_URL}/api/activity/track`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`Failed to track event: ${response.status}`)
  }
}

/**
 * Envia page view para o backend
 */
async function sendPageViewToBackend(payload: TrackPageViewPayload): Promise<void> {
  const response = await fetch(`${API_URL}/api/activity/track/pageview`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`Failed to track pageview: ${response.status}`)
  }
}

export class BackendAnalyticsProvider implements AnalyticsProvider {
  readonly name = 'Backend'

  init(): void {
    // Prevent multiple intervals if init() called more than once
    this.destroy()

    logger.analytics(`${this.name} initialized`)

    // Processa fila pendente a cada 30 segundos
    queueIntervalId = setInterval(() => {
      processQueue()
    }, 30000)

    // Cleanup on page unload to prevent memory leaks
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', this.handleUnload)
    }

    // Tenta processar fila ao iniciar
    processQueue()
  }

  destroy(): void {
    if (queueIntervalId !== null) {
      clearInterval(queueIntervalId)
      queueIntervalId = null
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', this.handleUnload)
    }
  }

  private handleUnload = (): void => {
    this.destroy()
  }

  trackPageView(pageName: string, pageUrl: string): void {
    // Captura UTM params do sessionStorage
    const utmParams = getStoredUtmParams()
    const utm: UtmData = {}

    if (utmParams.utm_source) utm.utm_source = utmParams.utm_source
    if (utmParams.utm_medium) utm.utm_medium = utmParams.utm_medium
    if (utmParams.utm_campaign) utm.utm_campaign = utmParams.utm_campaign
    if (utmParams.utm_content) utm.utm_content = utmParams.utm_content
    if (utmParams.utm_term) utm.utm_term = utmParams.utm_term

    const payload: TrackPageViewPayload = {
      pageName,
      pageUrl,
      ...(Object.keys(utm).length > 0 && { utm }),
    }

    // Envia de forma assincrona (fire and forget)
    sendPageViewToBackend(payload).catch(() => {
      enqueue({ type: 'pageview', data: payload })
    })
  }

  trackEvent(
    eventName: string,
    eventParams?: Record<string, string | number | boolean>,
  ): void {
    // Extrai informacoes uteis dos params
    const resourceId = eventParams?.project_id as string | undefined
      || eventParams?.report_id as string | undefined
      || eventParams?.trial_id as string | undefined
      || eventParams?.feedback_id as string | undefined

    const resourceName = eventParams?.project_name as string | undefined

    // Determina se eh um erro
    const isError = eventName.startsWith('error_')
    const errorMessage = isError
      ? (eventParams?.message as string | undefined)
      : undefined

    const payload: TrackEventPayload = {
      eventName,
      category: this.extractCategory(eventName),
      params: eventParams,
      pageUrl: window.location.href,
      pageName: window.location.pathname,
      resourceId,
      resourceName,
      success: !isError,
      errorMessage,
    }

    // Envia de forma assincrona (fire and forget)
    sendEventToBackend(payload).catch(() => {
      enqueue({ type: 'event', data: payload })
    })
  }

  setUserId(_userId: string): void {
    // Backend identifica usuario pelo token de autenticacao
  }

  setUserProperties(_properties: Record<string, string>): void {
    // Backend recebe propriedades via token de autenticacao
  }

  /**
   * Extrai categoria do nome do evento
   * Ex: 'funnel_trial_page_view' -> 'funnel'
   * Ex: 'nav_click_dashboard' -> 'nav'
   */
  private extractCategory(eventName: string): string {
    const parts = eventName.split('_')
    if (parts.length >= 2) {
      const knownCategories = [
        'funnel', 'nav', 'cta', 'auth',
        'feature', 'error', 'conversion', 'page',
      ]
      if (knownCategories.includes(parts[0])) {
        return parts[0]
      }
    }
    return 'other'
  }
}
