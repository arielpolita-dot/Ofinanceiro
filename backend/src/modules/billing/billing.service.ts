import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { fetchWithTimeout } from '../../common/utils/fetch-with-timeout.util';
import {
  OneTimePurchase,
  OneTimeProduct,
  SubscriptionCredits,
  SubscriptionPlan,
  Subscription,
  AvailableExecutionsResult,
  AvailableCreditsResult,
  CheckoutUrlOptions,
  CreditSource,
} from './billing.types';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  private readonly billingApiUrl: string;
  private readonly billingApiKey: string;

  constructor(
    private readonly configService: ConfigService,
  ) {
    this.billingApiUrl = this.configService.getOrThrow<string>('BILLING_API_URL');
    this.billingApiKey = this.configService.get('BILLING_API_KEY') || '';
  }

  /** Lista todas as compras pagas do usuário */
  async getAllPurchases(userId: string): Promise<OneTimePurchase[]> {
    try {
      const url = `${this.billingApiUrl}/checkout/purchase/${userId}`;
      const response = await fetchWithTimeout(url, {
        headers: { 'x-api-key': this.billingApiKey },
      });

      if (!response.ok) return [];

      const data = await response.json();
      const purchases = data.purchases || data || [];
      return purchases.filter((p: OneTimePurchase) => p.status === 'paid');
    } catch (error) {
      this.logger.error(`Failed to get purchases for user ${userId}`, error);
      return [];
    }
  }

  /** Verifica créditos disponíveis de one-time purchases */
  async hasAvailableExecutions(userId: string): Promise<AvailableExecutionsResult> {
    const empty: AvailableExecutionsResult = { available: false, remaining: 0, totalPurchased: 0, totalUsed: 0, purchases: [] };
    try {
      const purchases = await this.getAllPurchases(userId);
      if (purchases.length === 0) {
        return empty;
      }
      const totalPurchased = purchases.reduce((sum, p) => sum + p.executionsTotal, 0);
      const totalUsed = purchases.reduce((sum, p) => sum + p.executionsUsed, 0);
      const remaining = totalPurchased - totalUsed;
      const purchase = purchases.find((p) => p.executionsUsed < p.executionsTotal);
      return { available: remaining > 0, remaining, totalPurchased, totalUsed, purchases, purchase };
    } catch (error) {
      this.logger.error(`Failed to check executions for user ${userId}`, error);
      return empty;
    }
  }

  /** Consome uma execução de uma compra */
  async consumeExecution(purchaseId: string): Promise<boolean> {
    try {
      const url = `${this.billingApiUrl}/checkout/purchase/${purchaseId}/consume`;
      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: { 'x-api-key': this.billingApiKey },
      });
      return response.ok;
    } catch (error) {
      this.logger.error(`Failed to consume execution for purchase ${purchaseId}`, error);
      return false;
    }
  }

  /** Gera URL de checkout para one-time purchase */
  getCheckoutUrl(userId: string, email: string, name?: string, options?: CheckoutUrlOptions): string {
    const billingFrontendUrl = this.configService.getOrThrow<string>('BILLING_FRONTEND_URL');
    const appFrontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
    const successUrl = options?.successUrl ||
      (options?.projectId ? `${appFrontendUrl}/projects/${options.projectId}` : `${appFrontendUrl}/credits`);
    const params = new URLSearchParams({
      userId, email,
      ...(name && { name }),
      ...(options?.productId && { productId: options.productId }),
      successUrl,
      cancelUrl: options?.cancelUrl || `${appFrontendUrl}/credits`,
    });
    return `${billingFrontendUrl}/one-time?${params}`;
  }

  /** Lista produtos de créditos disponíveis */
  async getProducts(): Promise<OneTimeProduct[]> {
    try {
      const url = `${this.billingApiUrl}/checkout/one-time/products`;
      const response = await fetchWithTimeout(url, { headers: { 'x-api-key': this.billingApiKey } });
      if (!response.ok) return [];
      const data = await response.json();
      return data.products || data || [];
    } catch (error) {
      this.logger.warn('Failed to fetch products', error);
      return [];
    }
  }

  /** Verifica créditos de assinatura */
  async getSubscriptionCredits(userId: string): Promise<SubscriptionCredits> {
    try {
      const url = `${this.billingApiUrl}/subscription-credits/${userId}`;
      const response = await fetchWithTimeout(url, {
        headers: { 'x-api-key': this.billingApiKey },
      });

      if (!response.ok) return { hasSubscription: false, isUnlimited: false };

      return await response.json();
    } catch (error) {
      this.logger.error(`Failed to get subscription credits for user ${userId}`, error);
      return { hasSubscription: false, isUnlimited: false };
    }
  }

  /** Consome uma execução dos créditos de assinatura */
  async consumeSubscriptionCredit(userId: string): Promise<{ success: boolean; remaining: number }> {
    try {
      const url = `${this.billingApiUrl}/subscription-credits/${userId}/consume`;
      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': this.billingApiKey },
      });

      if (!response.ok) return { success: false, remaining: 0 };

      const data = await response.json();
      return { success: data.success, remaining: data.remaining };
    } catch (error) {
      this.logger.error(`Failed to consume subscription credit for user ${userId}`, error);
      return { success: false, remaining: 0 };
    }
  }

  /** Verifica créditos disponíveis de qualquer fonte (one-time + subscription) */
  async hasAvailableCredits(userId: string): Promise<AvailableCreditsResult> {
    const oneTimeCredits = await this.hasAvailableExecutions(userId);

    if (oneTimeCredits.available && oneTimeCredits.purchase) {
      return { available: true, remaining: oneTimeCredits.remaining, source: 'one_time', purchaseId: oneTimeCredits.purchase.id };
    }

    const subCredits = await this.getSubscriptionCredits(userId);
    if (subCredits.hasSubscription) {
      if (subCredits.isUnlimited) {
        return { available: true, remaining: -1, source: 'subscription', subscriptionId: subCredits.subscription?.id, isUnlimited: true };
      }
      if (subCredits.currentPeriod && subCredits.currentPeriod.remaining > 0) {
        return { available: true, remaining: subCredits.currentPeriod.remaining, source: 'subscription', subscriptionId: subCredits.subscription?.id };
      }
    }

    return { available: false, remaining: 0, source: 'none' };
  }

  /** Consome crédito da fonte apropriada */
  async consumeCredit(userId: string, source: CreditSource, purchaseId?: string): Promise<boolean> {
    if (source === 'one_time' && purchaseId) {
      return this.consumeExecution(purchaseId);
    }

    if (source === 'subscription') {
      const result = await this.consumeSubscriptionCredit(userId);
      return result.success;
    }

    return false;
  }

  /** Lista planos de assinatura disponíveis */
  async getPlans(): Promise<SubscriptionPlan[]> {
    try {
      const url = `${this.billingApiUrl}/checkout`;
      const response = await fetchWithTimeout(url, {
        headers: { 'x-api-key': this.billingApiKey },
      });

      if (!response.ok) return [];

      const data = await response.json();
      return data.plans || [];
    } catch (error) {
      this.logger.warn('Failed to fetch plans', error);
      return [];
    }
  }

  /** Busca assinatura ativa do usuário */
  async getSubscription(userId: string): Promise<Subscription | null> {
    try {
      const url = `${this.billingApiUrl}/checkout/subscription/${userId}`;
      const response = await fetchWithTimeout(url, {
        headers: { 'x-api-key': this.billingApiKey },
      });

      if (!response.ok) return null;

      const text = await response.text();
      if (!text || text.trim() === '') return null;

      return JSON.parse(text);
    } catch (error) {
      this.logger.warn(`Failed to fetch subscription for user ${userId}`, error);
      return null;
    }
  }

  /** Gera URL de checkout de assinatura */
  getSubscriptionCheckoutUrl(userId: string, email: string, name?: string): string {
    const billingFrontendUrl = this.configService.getOrThrow<string>('BILLING_FRONTEND_URL');
    const appFrontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');

    const params = new URLSearchParams({
      userId,
      email,
      ...(name && { name }),
      successUrl: `${appFrontendUrl}/plans`,
      cancelUrl: `${appFrontendUrl}/plans`,
    });
    return `${billingFrontendUrl}/checkout?${params}`;
  }

}
