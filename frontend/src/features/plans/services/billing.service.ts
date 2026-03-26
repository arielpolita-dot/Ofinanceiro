/**
 * ==============================================================================
 * Billing Service - Serviço de Cobrança
 * ==============================================================================
 *
 * Gerencia créditos de execução e checkout com Stripe.
 *
 * ## Endpoints
 *
 * | Método          | Endpoint               | Descrição                |
 * |-----------------|------------------------|--------------------------|
 * | getCredits()    | GET /billing/credits   | Saldo de créditos        |
 * | getProducts()   | GET /billing/products  | Produtos disponíveis     |
 * | getCheckoutUrl()| GET /billing/checkout-url | URL do Stripe Checkout |
 * | refreshCredits()| POST /billing/refresh-credits | Atualizar saldo     |
 *
 * ## Sistema de Créditos
 *
 * ```
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                    CREDIT FLOW                                  │
 * ├─────────────────────────────────────────────────────────────────┤
 * │                                                                 │
 * │  1. Usuário compra pacote de execuções                          │
 * │     └─▶ Stripe Checkout                                         │
 * │                                                                 │
 * │  2. Webhook Stripe confirma pagamento                           │
 * │     └─▶ Créditos adicionados                                    │
 * │                                                                 │
 * │  3. Cada scan consome 1 execução                                │
 * │     └─▶ executionsUsed++                                        │
 * │                                                                 │
 * │  4. Quando créditos = 0                                         │
 * │     └─▶ Redireciona para checkout                               │
 * │                                                                 │
 * └─────────────────────────────────────────────────────────────────┘
 * ```
 *
 * @module services
 */
import { api } from '../../../services/api'

/** Produto de compra única (pacote de execuções) */
export interface OneTimeProduct {
  id: string
  name: string
  description: string
  priceCents: number
  executionCount: number
  active: boolean
}

/** Plano de assinatura */
export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  priceCents: number
  currency: string
  interval: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'day' | 'week' | 'month' | 'year'
  intervalCount: number
  trialDays: number
  executionCount: number | null
  features: string[]
  isHighlighted: boolean
  sortOrder: number
  status: string
}

/** Assinatura do usuário */
export interface Subscription {
  id: string
  planId: string
  externalUserId: string
  externalUserEmail: string
  externalUserName?: string
  status: string
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  plan: SubscriptionPlan
}

export interface PurchaseInfo {
  id: string
  productId: string
  executionsTotal: number
  executionsUsed: number
  product: {
    id: string
    name: string
    priceCents: number
  }
}

/** Créditos de assinatura no período atual */
export interface SubscriptionCreditsInfo {
  id: string
  planId: string
  planName: string
  status: string
  currentPeriod?: {
    start: Date
    end: Date
    total: number
    used: number
    remaining: number
  }
  isUnlimited: boolean
  remaining: number
}

export interface CreditsInfo {
  available: boolean
  remaining: number
  /** Total de execuções compradas (soma de todas as compras) */
  totalPurchased: number
  /** Total de execuções usadas (soma de todas as compras) */
  totalUsed: number
  /** Lista de todas as compras pagas */
  purchases: PurchaseInfo[]
  /** Compra com créditos disponíveis (para consumo - legacy) */
  purchase?: PurchaseInfo
  /** Créditos de assinatura (se houver) */
  subscription?: SubscriptionCreditsInfo | null
  /** Total combinado (one-time + subscription). -1 = ilimitado */
  totalRemaining?: number
  /** Se tem assinatura com execuções ilimitadas */
  hasUnlimitedSubscription?: boolean
  /** Se é crédito gratuito (primeiro scan) */
  isFreeCredit?: boolean
}

/**
 * Serviço de billing e créditos.
 *
 * @example
 * // Verificar créditos
 * const credits = await billingService.getCredits()
 * if (credits.remaining === 0) {
 *   const { url } = await billingService.getCheckoutUrl(projectId)
 *   window.location.href = url
 * }
 *
 * // Formatar preço
 * const price = billingService.formatPrice(2990) // R$ 29,90
 */
class BillingService {
  async getCredits(): Promise<CreditsInfo> {
    const result = await api.get<CreditsInfo>('/billing/credits')
    return result ?? { available: false, remaining: 0, totalPurchased: 0, totalUsed: 0, purchases: [] }
  }

  async getProducts(): Promise<OneTimeProduct[]> {
    const result = await api.get<OneTimeProduct[]>('/billing/products')
    return result ?? []
  }

  async getCheckoutUrl(projectId?: string): Promise<{ url: string }> {
    const params = projectId ? `?projectId=${projectId}` : ''
    return api.get<{ url: string }>(`/billing/checkout-url${params}`)
  }

  async refreshCredits(): Promise<CreditsInfo> {
    const result = await api.post<CreditsInfo>('/billing/refresh-credits')
    return result ?? { available: false, remaining: 0, totalPurchased: 0, totalUsed: 0, purchases: [] }
  }

  formatPrice(priceCents: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(priceCents / 100)
  }

  /** Obtém planos de assinatura disponíveis */
  async getPlans(): Promise<SubscriptionPlan[]> {
    return api.get<SubscriptionPlan[]>('/billing/plans')
  }

  /** Obtém assinatura atual do usuário */
  async getSubscription(): Promise<Subscription | null> {
    return api.get<Subscription | null>('/billing/subscription')
  }

  /** Gera URL de checkout para assinatura */
  async getSubscriptionCheckoutUrl(): Promise<{ url: string }> {
    return api.get<{ url: string }>('/billing/subscription-checkout-url')
  }

  /** Formata intervalo do plano */
  formatInterval(interval: string, count: number): string {
    const intervals: Record<string, string> = {
      day: count === 1 ? 'dia' : 'dias',
      daily: count === 1 ? 'dia' : 'dias',
      week: count === 1 ? 'semana' : 'semanas',
      weekly: count === 1 ? 'semana' : 'semanas',
      month: count === 1 ? 'mês' : 'meses',
      monthly: count === 1 ? 'mês' : 'meses',
      year: count === 1 ? 'ano' : 'anos',
      yearly: count === 1 ? 'ano' : 'anos',
    }
    const label = intervals[interval] || interval
    return count === 1 ? `por ${label}` : `a cada ${count} ${label}`
  }
}

export const billingService = new BillingService()
