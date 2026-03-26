import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { BillingController } from '../billing.controller';
import { BillingService } from '../billing.service';
import { ConversionsTrackingService } from '../../../common/services/conversions-tracking.service';
import { AuthGuard } from '../../../common/guards/auth.guard';

const mockBillingService = {
  getProducts: jest.fn(),
  hasAvailableExecutions: jest.fn(),
  getSubscriptionCredits: jest.fn(),
  getCheckoutUrl: jest.fn(),
  getPlans: jest.fn(),
  getSubscription: jest.fn(),
  getSubscriptionCheckoutUrl: jest.fn(),
};

const mockConversionsTracking = {
  trackLead: jest.fn().mockResolvedValue(undefined),
  trackCompleteRegistration: jest.fn().mockResolvedValue(undefined),
  trackPurchase: jest.fn().mockResolvedValue(undefined),
  trackScanCompleted: jest.fn().mockResolvedValue(undefined),
  trackViewContent: jest.fn().mockResolvedValue(undefined),
};

const createReq = (user?: any) => ({ user } as any);

describe('BillingController', () => {
  let controller: BillingController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BillingController],
      providers: [
        { provide: BillingService, useValue: mockBillingService },
        { provide: ConversionsTrackingService, useValue: mockConversionsTracking },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();
    controller = module.get(BillingController);
  });

  describe('GET /products', () => {
    it('should return products list', async () => {
      const products = [{ id: 'pr1', name: 'Pack 10' }];
      mockBillingService.getProducts.mockResolvedValue(products);
      expect(await controller.getProducts()).toEqual(products);
    });
  });

  describe('GET /credits', () => {
    const user = { id: 'u1', email: 'a@b.c', name: 'Test' };

    it('should throw BadRequestException when no user', async () => {
      await expect(controller.getCredits(createReq())).rejects.toThrow(BadRequestException);
      await expect(controller.getCredits(createReq({ id: 'u1' }))).rejects.toThrow(BadRequestException);
    });

    it('should return combined credits (one-time only)', async () => {
      mockBillingService.hasAvailableExecutions.mockResolvedValue({
        available: true, remaining: 5, totalPurchased: 10, totalUsed: 5, purchases: [],
      });
      mockBillingService.getSubscriptionCredits.mockResolvedValue({
        hasSubscription: false, isUnlimited: false,
      });
      const result = await controller.getCredits(createReq(user));
      expect(result.totalRemaining).toBe(5);
      expect(result.subscription).toBeNull();
      expect(result.hasUnlimitedSubscription).toBe(false);
    });

    it('should return combined credits with subscription', async () => {
      mockBillingService.hasAvailableExecutions.mockResolvedValue({
        available: true, remaining: 3, totalPurchased: 5, totalUsed: 2, purchases: [],
      });
      mockBillingService.getSubscriptionCredits.mockResolvedValue({
        hasSubscription: true, isUnlimited: false,
        subscription: { id: 's1', planName: 'Pro' },
        currentPeriod: { remaining: 10, total: 20, used: 10 },
      });
      const result = await controller.getCredits(createReq(user));
      expect(result.totalRemaining).toBe(13); // 3 + 10
      expect(result.subscription).toBeTruthy();
      expect(result.subscription!.remaining).toBe(10);
    });

    it('should not add subscription remaining when remaining is 0 (lines 84-86)', async () => {
      mockBillingService.hasAvailableExecutions.mockResolvedValue({
        available: true, remaining: 3, totalPurchased: 5, totalUsed: 2, purchases: [],
      });
      mockBillingService.getSubscriptionCredits.mockResolvedValue({
        hasSubscription: true, isUnlimited: false,
        subscription: { id: 's1' },
        currentPeriod: { remaining: 0, total: 20, used: 20 },
      });
      const result = await controller.getCredits(createReq(user));
      expect(result.totalRemaining).toBe(3); // only one-time, no subscription added
      expect(result.subscription!.remaining).toBe(0);
    });

    it('should handle subscription without currentPeriod (line 84)', async () => {
      mockBillingService.hasAvailableExecutions.mockResolvedValue({
        available: false, remaining: 0, totalPurchased: 0, totalUsed: 0, purchases: [],
      });
      mockBillingService.getSubscriptionCredits.mockResolvedValue({
        hasSubscription: true, isUnlimited: false,
        subscription: { id: 's1' },
      });
      const result = await controller.getCredits(createReq(user));
      expect(result.subscription!.remaining).toBe(0);
      expect(result.totalRemaining).toBe(0);
    });

    it('should return -1 totalRemaining for unlimited subscription', async () => {
      mockBillingService.hasAvailableExecutions.mockResolvedValue({
        available: false, remaining: 0, totalPurchased: 0, totalUsed: 0, purchases: [],
      });
      mockBillingService.getSubscriptionCredits.mockResolvedValue({
        hasSubscription: true, isUnlimited: true,
        subscription: { id: 's1' },
      });
      const result = await controller.getCredits(createReq(user));
      expect(result.totalRemaining).toBe(-1);
      expect(result.hasUnlimitedSubscription).toBe(true);
    });
  });

  describe('GET /checkout-url', () => {
    it('should return checkout URL', async () => {
      mockBillingService.getCheckoutUrl.mockReturnValue('https://billing.test/checkout?x=1');
      const req = createReq({ id: 'u1', email: 'a@b.c', name: 'Test' });
      const result = await controller.getCheckoutUrl(req, 'proj-1');
      expect(result).toEqual({ url: 'https://billing.test/checkout?x=1' });
      expect(mockBillingService.getCheckoutUrl).toHaveBeenCalledWith('u1', 'a@b.c', 'Test', { projectId: 'proj-1' });
    });

    it('should throw BadRequestException when no user', async () => {
      await expect(controller.getCheckoutUrl(createReq(), undefined)).rejects.toThrow(BadRequestException);
    });
  });

  describe('GET /plans', () => {
    it('should return plans list', async () => {
      const plans = [{ id: 'plan1', name: 'Pro' }];
      mockBillingService.getPlans.mockResolvedValue(plans);
      expect(await controller.getPlans()).toEqual(plans);
    });
  });

  describe('GET /subscription', () => {
    it('should return user subscription', async () => {
      const sub = { id: 's1', planId: 'plan1', status: 'active' };
      mockBillingService.getSubscription.mockResolvedValue(sub);
      expect(await controller.getSubscription(createReq({ id: 'u1' }))).toEqual(sub);
    });

    it('should return null when no subscription', async () => {
      mockBillingService.getSubscription.mockResolvedValue(null);
      expect(await controller.getSubscription(createReq({ id: 'u1' }))).toBeNull();
    });

    it('should throw BadRequestException when no user', async () => {
      await expect(controller.getSubscription(createReq())).rejects.toThrow(BadRequestException);
    });
  });

  describe('GET /subscription-checkout-url', () => {
    it('should return subscription checkout URL', async () => {
      mockBillingService.getSubscriptionCheckoutUrl.mockReturnValue('https://billing.test/sub?x=1');
      const req = createReq({ id: 'u1', email: 'a@b.c', name: 'Test' });
      const result = await controller.getSubscriptionCheckoutUrl(req);
      expect(result).toEqual({ url: 'https://billing.test/sub?x=1' });
    });

    it('should throw BadRequestException when no user data', async () => {
      await expect(controller.getSubscriptionCheckoutUrl(createReq())).rejects.toThrow(BadRequestException);
      await expect(controller.getSubscriptionCheckoutUrl(createReq({ id: 'u1' }))).rejects.toThrow(BadRequestException);
    });
  });
});
