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

describe('BillingService — credits, plans & grants', () => {
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

  describe('hasAvailableCredits', () => {
    it('should return one_time source when purchases available', async () => {
      const purchases = [{ id: 'p1', status: 'paid', executionsTotal: 10, executionsUsed: 2 }];
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ purchases }) });
      const result = await service.hasAvailableCredits('u1');
      expect(result.source).toBe('one_time');
      expect(result.purchaseId).toBe('p1');
    });

    it('should return subscription source when one-time exhausted', async () => {
      const purchases = [{ id: 'p1', status: 'paid', executionsTotal: 5, executionsUsed: 5 }];
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ purchases }) })
        .mockResolvedValueOnce({
          ok: true, json: () => Promise.resolve({
            hasSubscription: true, isUnlimited: false,
            subscription: { id: 's1' }, currentPeriod: { remaining: 5 },
          }),
        });
      const result = await service.hasAvailableCredits('u1');
      expect(result.source).toBe('subscription');
    });

    it('should return unlimited subscription', async () => {
      const purchases = [{ id: 'p1', status: 'paid', executionsTotal: 5, executionsUsed: 5 }];
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ purchases }) })
        .mockResolvedValueOnce({
          ok: true, json: () => Promise.resolve({
            hasSubscription: true, isUnlimited: true, subscription: { id: 's1' },
          }),
        });
      const result = await service.hasAvailableCredits('u1');
      expect(result.isUnlimited).toBe(true);
      expect(result.remaining).toBe(-1);
    });

    it('should return none when subscription has no remaining credits', async () => {
      const purchases = [{ id: 'p1', status: 'paid', executionsTotal: 5, executionsUsed: 5 }];
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ purchases }) })
        .mockResolvedValueOnce({
          ok: true, json: () => Promise.resolve({
            hasSubscription: true, isUnlimited: false,
            subscription: { id: 's1' }, currentPeriod: { remaining: 0 },
          }),
        });
      const result = await service.hasAvailableCredits('u1');
      expect(result).toEqual({ available: false, remaining: 0, source: 'none' });
    });

    it('should return none when subscription has no currentPeriod', async () => {
      const purchases = [{ id: 'p1', status: 'paid', executionsTotal: 5, executionsUsed: 5 }];
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ purchases }) })
        .mockResolvedValueOnce({
          ok: true, json: () => Promise.resolve({
            hasSubscription: true, isUnlimited: false, subscription: { id: 's1' },
          }),
        });
      const result = await service.hasAvailableCredits('u1');
      expect(result).toEqual({ available: false, remaining: 0, source: 'none' });
    });

    it('should return none when no credits available', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ purchases: [] }) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ hasSubscription: false, isUnlimited: false }) });
      const result = await service.hasAvailableCredits('u1');
      expect(result).toEqual({ available: false, remaining: 0, source: 'none' });
    });
  });

  describe('consumeCredit', () => {
    it('should consume one_time purchase', async () => {
      mockFetch.mockResolvedValue({ ok: true });
      expect(await service.consumeCredit('u1', 'one_time', 'p1')).toBe(true);
    });

    it('should consume subscription credit', async () => {
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ success: true, remaining: 4 }) });
      expect(await service.consumeCredit('u1', 'subscription')).toBe(true);
    });

    it('should return false for one_time without purchaseId', async () => {
      expect(await service.consumeCredit('u1', 'one_time')).toBe(false);
    });
  });

  describe('getPlans', () => {
    it('should return plans list', async () => {
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ plans: [{ id: 'plan1' }] }) });
      expect(await service.getPlans()).toEqual([{ id: 'plan1' }]);
    });

    it('should return empty array on error', async () => {
      mockFetch.mockResolvedValue({ ok: false });
      expect(await service.getPlans()).toEqual([]);
    });

    it('should return empty array on network error', async () => {
      mockFetch.mockRejectedValue(new Error('err'));
      expect(await service.getPlans()).toEqual([]);
    });

    it('should return empty array when plans property missing', async () => {
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
      expect(await service.getPlans()).toEqual([]);
    });
  });

  describe('getSubscription', () => {
    it('should return subscription', async () => {
      const sub = { id: 's1', status: 'active' };
      mockFetch.mockResolvedValue({ ok: true, text: () => Promise.resolve(JSON.stringify(sub)) });
      expect(await service.getSubscription('u1')).toEqual(sub);
    });

    it('should return null on HTTP error', async () => {
      mockFetch.mockResolvedValue({ ok: false });
      expect(await service.getSubscription('u1')).toBeNull();
    });

    it('should return null when response body is empty', async () => {
      mockFetch.mockResolvedValue({ ok: true, text: () => Promise.resolve('') });
      expect(await service.getSubscription('u1')).toBeNull();
    });

    it('should return null on network error', async () => {
      mockFetch.mockRejectedValue(new Error('err'));
      expect(await service.getSubscription('u1')).toBeNull();
    });
  });

  describe('getSubscriptionCheckoutUrl', () => {
    it('should generate subscription checkout URL with all params', () => {
      const url = service.getSubscriptionCheckoutUrl('u1', 'a@b.c', 'Test');
      expect(url).toContain('https://billing-fe.test/checkout?');
      expect(url).toContain('userId=u1');
      expect(url).toContain('email=a%40b.c');
      expect(url).toContain('name=Test');
    });

    it('should omit name param when not provided', () => {
      const url = service.getSubscriptionCheckoutUrl('u1', 'a@b.c');
      expect(url).not.toContain('name=');
    });
  });
});
