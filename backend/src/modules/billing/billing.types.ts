/**
 * Tipos e interfaces do módulo de Billing
 */

/** Compra de pacote de créditos (one-time purchase) */
export interface OneTimePurchase {
  id: string;
  productId: string;
  externalUserId: string;
  executionsTotal: number;
  executionsUsed: number;
  status: 'pending' | 'paid' | 'expired' | 'refunded';
  product: {
    id: string;
    name: string;
    /** Preço em centavos */
    priceCents: number;
  };
}

/** Produto de créditos disponível para compra */
export interface OneTimeProduct {
  id: string;
  name: string;
  description: string;
  /** Preço em centavos */
  priceCents: number;
  executionCount: number;
  active: boolean;
}

/** Créditos disponíveis de uma assinatura mensal */
export interface SubscriptionCredits {
  hasSubscription: boolean;
  subscription?: {
    id: string;
    planId: string;
    planName: string;
    status: string;
  };
  currentPeriod?: {
    start: Date;
    end: Date;
    total: number;
    used: number;
    remaining: number;
  };
  isUnlimited: boolean;
}

/** Plano de assinatura disponível para compra */
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  currency: string;
  interval: 'day' | 'week' | 'month' | 'year';
  intervalCount: number;
  trialDays: number;
  executionCount: number | null;
  features: string[];
  isHighlighted: boolean;
  sortOrder: number;
  status: string;
}

/** Assinatura ativa do usuário */
export interface Subscription {
  id: string;
  planId: string;
  externalUserId: string;
  externalUserEmail: string;
  externalUserName?: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  plan: SubscriptionPlan;
}

/** Resultado da verificação de créditos disponíveis (one-time) */
export interface AvailableExecutionsResult {
  available: boolean;
  remaining: number;
  totalPurchased: number;
  totalUsed: number;
  purchases: OneTimePurchase[];
  purchase?: OneTimePurchase;
}

/** Resultado da verificação unificada de créditos */
export interface AvailableCreditsResult {
  available: boolean;
  remaining: number;
  source: 'one_time' | 'subscription' | 'none';
  purchaseId?: string;
  subscriptionId?: string;
  isUnlimited?: boolean;
}

/** Opções para geração de URL de checkout */
export interface CheckoutUrlOptions {
  projectId?: string;
  productId?: string;
  successUrl?: string;
  cancelUrl?: string;
}

export type CreditSource = 'one_time' | 'subscription';
