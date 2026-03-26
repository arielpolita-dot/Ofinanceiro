/**
 * ==============================================================================
 * BillingController - API REST de Billing
 * ==============================================================================
 *
 * Controller que expõe endpoints relacionados a créditos e compras.
 * Todas as rotas são protegidas pelo AuthGuard.
 *
 * ## Endpoints Disponíveis
 *
 * | Método | Endpoint              | Descrição                    |
 * |--------|-----------------------|------------------------------|
 * | GET    | /billing/products     | Lista produtos disponíveis   |
 * | GET    | /billing/credits      | Consulta créditos do usuário |
 * | GET    | /billing/checkout-url | Gera URL de checkout         |
 *
 * @module billing
 * @see {@link BillingService} para lógica de negócio
 */
import {
  Controller,
  Get,
  UseGuards,
  Req,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthUser } from '../auth/auth-bff.types';
import { BillingService } from './billing.service';
import { ConversionsTrackingService } from '../../common/services/conversions-tracking.service';
import { AuthGuard } from '../../common/guards/auth.guard';

/**
 * =========================================================================
 * BillingController - Controller de Billing
 * =========================================================================
 *
 * Gerencia consulta de créditos e produtos. Protegido por AuthGuard.
 *
 * @class BillingController
 */
@Controller('billing')
@UseGuards(AuthGuard)
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
    private readonly conversionsTracking: ConversionsTrackingService,
  ) {}

  /**
   * GET /billing/products - Lista pacotes de créditos disponíveis.
   *
   * @returns {Promise<OneTimeProduct[]>} Lista de produtos
   */
  @Get('products')
  async getProducts() {
    return this.billingService.getProducts();
  }

  /**
   * GET /billing/credits - Consulta créditos do usuário (one-time + subscription).
   *
   * Retorna créditos combinados de pacotes one-time e assinaturas.
   *
   * @param {Request} req - Request com usuário autenticado
   * @returns {Promise<{available: boolean, remaining: number, ...}>}
   */
  @Get('credits')
  async getCredits(@Req() req: Request) {
    const user = req.user as AuthUser | undefined;
    if (!user?.id || !user?.email) {
      throw new BadRequestException('User not found');
    }

    // Buscar créditos de one-time purchases
    const oneTimeCredits = await this.billingService.hasAvailableExecutions(user.id);

    // Buscar créditos de subscription
    const subscriptionCredits = await this.billingService.getSubscriptionCredits(user.id);

    // Calcular total combinado
    let totalRemaining = oneTimeCredits.remaining;
    let subscriptionRemaining = 0;

    if (subscriptionCredits.hasSubscription) {
      if (subscriptionCredits.isUnlimited) {
        subscriptionRemaining = -1; // Unlimited
      } else if (subscriptionCredits.currentPeriod) {
        subscriptionRemaining = subscriptionCredits.currentPeriod.remaining;
        if (subscriptionRemaining > 0) {
          totalRemaining += subscriptionRemaining;
        }
      }
    }

    return {
      // One-time credits
      ...oneTimeCredits,
      // Subscription credits
      subscription: subscriptionCredits.hasSubscription
        ? {
            ...subscriptionCredits.subscription,
            currentPeriod: subscriptionCredits.currentPeriod,
            isUnlimited: subscriptionCredits.isUnlimited,
            remaining: subscriptionRemaining,
          }
        : null,
      // Combined totals
      totalRemaining: subscriptionRemaining === -1 ? -1 : totalRemaining,
      hasUnlimitedSubscription: subscriptionCredits.isUnlimited,
    };
  }

  /**
   * GET /billing/checkout-url - Gera URL de checkout.
   *
   * Uses companyId from user's active project (projectId) for redirect.
   *
   * @param {Request} req - Request com usuário autenticado
   * @param {string} [companyId] - Override company ID (defaults to req.user.projectId)
   * @returns {Promise<{url: string}>} URL de checkout
   */
  @Get('checkout-url')
  async getCheckoutUrl(
    @Req() req: Request,
    @Query('companyId') companyId?: string,
  ) {
    const user = req.user as AuthUser | undefined;
    if (!user?.id || !user?.email) {
      throw new BadRequestException('User data not found');
    }
    const projectId = companyId || user.projectId;
    return {
      url: this.billingService.getCheckoutUrl(user.id, user.email, user.name, {
        projectId,
      }),
    };
  }

  /**
   * GET /billing/plans - Lista planos de assinatura disponíveis.
   *
   * @returns {Promise<SubscriptionPlan[]>} Lista de planos
   */
  @Get('plans')
  async getPlans() {
    return this.billingService.getPlans();
  }

  /**
   * GET /billing/subscription - Consulta assinatura do usuário.
   *
   * @param {Request} req - Request com usuário autenticado
   * @returns {Promise<Subscription | null>} Assinatura ou null
   */
  @Get('subscription')
  async getSubscription(@Req() req: Request) {
    const user = req.user as AuthUser | undefined;
    if (!user?.id) {
      throw new BadRequestException('User not found');
    }
    return this.billingService.getSubscription(user.id);
  }

  /**
   * GET /billing/subscription-checkout-url - Gera URL de checkout de assinatura.
   *
   * @param {Request} req - Request com usuário autenticado
   * @returns {Promise<{url: string}>} URL de checkout
   */
  @Get('subscription-checkout-url')
  async getSubscriptionCheckoutUrl(@Req() req: Request) {
    const user = req.user as AuthUser | undefined;
    if (!user?.id || !user?.email) {
      throw new BadRequestException('User data not found');
    }

    // Track checkout initiation (fire-and-forget)
    this.conversionsTracking.trackLead({
      email: user.email,
      externalId: user.id,
    }).catch(() => {});

    return {
      url: this.billingService.getSubscriptionCheckoutUrl(
        user.id,
        user.email,
        user.name,
      ),
    };
  }
}
