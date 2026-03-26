import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BillingService } from '../billing.service';

const mockFetch = jest.fn();
global.fetch = mockFetch;

const configVals: Record<string, string> = {
  BILLING_API_URL: 'https://billing.test',
  BILLING_API_KEY: 'bk-123',
    BILLING_FRONTEND_URL: 'https://billing-fe.test',
  FRONTEND_URL: 'https://app.test',
};
const mockConfig = {
  get: jest.fn((key: string) => configVals[key] || ''),
  getOrThrow: jest.fn((key: string) => {
    if (configVals[key]) return configVals[key];
    throw new Error(`Missing ${key}`);
  }),
};

describe('BillingService — purchases & executions', () => {
  let service: BillingService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();
    service = module.get(BillingService);
  });

  describe('getAllPurchases', () => {
    it('should return paid purchases only', async () => {
      const purchases = [
        { id: 'p1', status: 'paid', executionsTotal: 10, executionsUsed: 2 },
        { id: 'p2', status: 'pending', executionsTotal: 5, executionsUsed: 0 },
      ];
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ purchases }) });
      const result = await service.getAllPurchases('u1');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('p1');
    });

    it('should return empty array on HTTP error', async () => {
      mockFetch.mockResolvedValue({ ok: false });
      expect(await service.getAllPurchases('u1')).toEqual([]);
    });

    it('should return empty array on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Timeout'));
      expect(await service.getAllPurchases('u1')).toEqual([]);
    });
  });

  describe('hasAvailableExecutions', () => {
    it('should return unavailable when no purchases', async () => {
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ purchases: [] }) });
      const result = await service.hasAvailableExecutions('u1');
      expect(result.available).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should calculate remaining from purchases', async () => {
      const purchases = [
        { id: 'p1', status: 'paid', executionsTotal: 10, executionsUsed: 3 },
        { id: 'p2', status: 'paid', executionsTotal: 5, executionsUsed: 5 },
      ];
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ purchases }) });
      const result = await service.hasAvailableExecutions('u1');
      expect(result.available).toBe(true);
      expect(result.remaining).toBe(7);
      expect(result.totalPurchased).toBe(15);
      expect(result.totalUsed).toBe(8);
      expect(result.purchase?.id).toBe('p1');
    });

    it('should return unavailable when all executions consumed', async () => {
      const purchases = [{ id: 'p1', status: 'paid', executionsTotal: 5, executionsUsed: 5 }];
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ purchases }) });
      const result = await service.hasAvailableExecutions('u1');
      expect(result.available).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should return empty result on error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      const result = await service.hasAvailableExecutions('u1');
      expect(result.available).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });

  describe('consumeExecution', () => {
    it('should return true on success', async () => {
      mockFetch.mockResolvedValue({ ok: true });
      expect(await service.consumeExecution('p1')).toBe(true);
    });

    it('should return false on failure', async () => {
      mockFetch.mockResolvedValue({ ok: false });
      expect(await service.consumeExecution('p1')).toBe(false);
    });

    it('should return false on network error', async () => {
      mockFetch.mockRejectedValue(new Error('err'));
      expect(await service.consumeExecution('p1')).toBe(false);
    });
  });

  describe('getCheckoutUrl', () => {
    it('should generate checkout URL with params', () => {
      const url = service.getCheckoutUrl('u1', 'a@b.c', 'Test');
      expect(url).toContain('https://billing-fe.test/one-time?');
      expect(url).toContain('userId=u1');
      expect(url).toContain('email=a%40b.c');
      expect(url).toContain('name=Test');
    });

    it('should use projectId in successUrl when provided', () => {
      const url = service.getCheckoutUrl('u1', 'a@b.c', undefined, { projectId: 'proj-x' });
      expect(url).toContain('projects%2Fproj-x');
    });

    it('should use custom successUrl when provided', () => {
      const url = service.getCheckoutUrl('u1', 'a@b.c', undefined, { successUrl: 'https://custom.url/done' });
      expect(url).toContain(encodeURIComponent('https://custom.url/done'));
    });

    it('should omit name and productId when not provided', () => {
      const url = service.getCheckoutUrl('u1', 'a@b.c');
      expect(url).not.toContain('name=');
      expect(url).not.toContain('productId=');
      expect(url).toContain(encodeURIComponent('https://app.test/credits'));
    });

    it('should include productId and custom cancelUrl', () => {
      const url = service.getCheckoutUrl('u1', 'a@b.c', undefined, { productId: 'prod-1', cancelUrl: 'https://x.com/c' });
      expect(url).toContain('productId=prod-1');
      expect(url).toContain(encodeURIComponent('https://x.com/c'));
    });
  });

  describe('getProducts', () => {
    it('should return products list', async () => {
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ products: [{ id: 'pr1' }] }) });
      expect(await service.getProducts()).toEqual([{ id: 'pr1' }]);
    });

    it('should return empty array on error', async () => {
      mockFetch.mockResolvedValue({ ok: false });
      expect(await service.getProducts()).toEqual([]);
    });

    it('should return empty array on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      expect(await service.getProducts()).toEqual([]);
    });
  });

  describe('getSubscriptionCredits', () => {
    it('should return subscription credits', async () => {
      const credits = { hasSubscription: true, isUnlimited: true };
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(credits) });
      expect(await service.getSubscriptionCredits('u1')).toEqual(credits);
    });

    it('should return default on error', async () => {
      mockFetch.mockResolvedValue({ ok: false });
      expect(await service.getSubscriptionCredits('u1')).toEqual({ hasSubscription: false, isUnlimited: false });
    });

    it('should return default on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      expect(await service.getSubscriptionCredits('u1')).toEqual({ hasSubscription: false, isUnlimited: false });
    });
  });

  describe('consumeSubscriptionCredit', () => {
    it('should return success result', async () => {
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ success: true, remaining: 9 }) });
      expect(await service.consumeSubscriptionCredit('u1')).toEqual({ success: true, remaining: 9 });
    });

    it('should return failure on error', async () => {
      mockFetch.mockResolvedValue({ ok: false });
      expect(await service.consumeSubscriptionCredit('u1')).toEqual({ success: false, remaining: 0 });
    });

    it('should return failure on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      expect(await service.consumeSubscriptionCredit('u1')).toEqual({ success: false, remaining: 0 });
    });
  });

  describe('data fallback branches', () => {
    it('should use data array directly when purchases prop missing', async () => {
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve([{ id: 'p1', status: 'paid', executionsTotal: 5, executionsUsed: 1 }]) });
      expect(await service.getAllPurchases('u1')).toHaveLength(1);
    });
    it('should use [] when data is falsy for purchases', async () => {
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(0) });
      expect(await service.getAllPurchases('u1')).toEqual([]);
    });
    it('should use data array directly when products prop missing', async () => {
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve([{ id: 'pr1' }]) });
      expect(await service.getProducts()).toEqual([{ id: 'pr1' }]);
    });
    it('should use [] when data is falsy for products', async () => {
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(0) });
      expect(await service.getProducts()).toEqual([]);
    });
  });

  describe('config defaults and whitespace', () => {
    it('should use default URLs when env vars empty', async () => {
      const emptyConfig = {
        get: jest.fn(() => ''),
        getOrThrow: jest.fn((key: string) => { throw new Error(`Missing ${key}`); }),
      };
      await expect(
        Test.createTestingModule({
          providers: [BillingService, { provide: ConfigService, useValue: emptyConfig }],
        }).compile(),
      ).rejects.toThrow('Missing BILLING_API_URL');
    });
    it('should return null for whitespace body in getSubscription', async () => {
      mockFetch.mockResolvedValue({ ok: true, text: () => Promise.resolve('   ') });
      expect(await service.getSubscription('u1')).toBeNull();
    });
    it('should throw when required URLs missing', () => {
      mockConfig.getOrThrow.mockImplementation((key: string) => { throw new Error(`Missing ${key}`); });
      expect(() => service.getCheckoutUrl('u1', 'a@b.c')).toThrow('Missing BILLING_FRONTEND_URL');
    });
  });
});
