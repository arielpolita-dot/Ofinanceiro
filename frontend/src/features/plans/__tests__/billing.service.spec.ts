import { describe, it, expect, vi, beforeEach } from 'vitest'
import { billingService } from '../services/billing.service'
import { api } from '../../../services/api'

vi.mock('../../../services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('BillingService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getCredits', () => {
    it('calls GET /billing/credits', async () => {
      const mockCredits = { available: true, remaining: 5, totalPurchased: 10, totalUsed: 5, purchases: [] }
      vi.mocked(api.get).mockResolvedValueOnce(mockCredits)

      const result = await billingService.getCredits()

      expect(api.get).toHaveBeenCalledWith('/billing/credits')
      expect(result).toEqual(mockCredits)
    })
  })

  describe('getProducts', () => {
    it('calls GET /billing/products', async () => {
      const products = [{ id: '1', name: 'Pack 10', priceCents: 2990 }]
      vi.mocked(api.get).mockResolvedValueOnce(products)

      const result = await billingService.getProducts()

      expect(api.get).toHaveBeenCalledWith('/billing/products')
      expect(result).toEqual(products)
    })
  })

  describe('getCheckoutUrl', () => {
    it('calls without projectId', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({ url: 'https://stripe.com/checkout' })

      const result = await billingService.getCheckoutUrl()

      expect(api.get).toHaveBeenCalledWith('/billing/checkout-url')
      expect(result.url).toBe('https://stripe.com/checkout')
    })

    it('appends projectId as query param', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({ url: 'https://stripe.com/checkout' })

      await billingService.getCheckoutUrl('proj-123')

      expect(api.get).toHaveBeenCalledWith('/billing/checkout-url?projectId=proj-123')
    })
  })

  describe('refreshCredits', () => {
    it('calls POST /billing/refresh-credits', async () => {
      const mockCredits = { available: true, remaining: 15, totalPurchased: 15, totalUsed: 0, purchases: [] }
      vi.mocked(api.post).mockResolvedValueOnce(mockCredits)

      const result = await billingService.refreshCredits()

      expect(api.post).toHaveBeenCalledWith('/billing/refresh-credits')
      expect(result).toEqual(mockCredits)
    })
  })

  describe('getPlans', () => {
    it('calls GET /billing/plans', async () => {
      const plans = [{ id: '1', name: 'Pro', priceCents: 4990 }]
      vi.mocked(api.get).mockResolvedValueOnce(plans)

      const result = await billingService.getPlans()

      expect(api.get).toHaveBeenCalledWith('/billing/plans')
      expect(result).toEqual(plans)
    })
  })

  describe('getSubscription', () => {
    it('calls GET /billing/subscription', async () => {
      const sub = { id: 'sub-1', planId: 'plan-1', status: 'active' }
      vi.mocked(api.get).mockResolvedValueOnce(sub)

      const result = await billingService.getSubscription()

      expect(api.get).toHaveBeenCalledWith('/billing/subscription')
      expect(result).toEqual(sub)
    })

    it('returns null when no subscription', async () => {
      vi.mocked(api.get).mockResolvedValueOnce(null)

      const result = await billingService.getSubscription()

      expect(result).toBeNull()
    })
  })

  describe('getSubscriptionCheckoutUrl', () => {
    it('calls GET /billing/subscription-checkout-url', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({ url: 'https://stripe.com/sub' })

      const result = await billingService.getSubscriptionCheckoutUrl()

      expect(api.get).toHaveBeenCalledWith('/billing/subscription-checkout-url')
      expect(result.url).toBe('https://stripe.com/sub')
    })
  })

  describe('formatPrice', () => {
    it('formats cents to BRL currency', () => {
      expect(billingService.formatPrice(2990)).toMatch(/29,90/)
      expect(billingService.formatPrice(0)).toMatch(/0,00/)
      expect(billingService.formatPrice(100)).toMatch(/1,00/)
      expect(billingService.formatPrice(9999)).toMatch(/99,99/)
    })
  })

  describe('formatInterval', () => {
    it('formats singular intervals', () => {
      expect(billingService.formatInterval('month', 1)).toBe('por mês')
      expect(billingService.formatInterval('monthly', 1)).toBe('por mês')
      expect(billingService.formatInterval('year', 1)).toBe('por ano')
      expect(billingService.formatInterval('yearly', 1)).toBe('por ano')
      expect(billingService.formatInterval('day', 1)).toBe('por dia')
      expect(billingService.formatInterval('daily', 1)).toBe('por dia')
      expect(billingService.formatInterval('week', 1)).toBe('por semana')
      expect(billingService.formatInterval('weekly', 1)).toBe('por semana')
    })

    it('formats plural intervals', () => {
      expect(billingService.formatInterval('month', 3)).toBe('a cada 3 meses')
      expect(billingService.formatInterval('day', 7)).toBe('a cada 7 dias')
      expect(billingService.formatInterval('year', 2)).toBe('a cada 2 anos')
      expect(billingService.formatInterval('week', 2)).toBe('a cada 2 semanas')
    })

    it('handles unknown interval', () => {
      expect(billingService.formatInterval('custom', 1)).toBe('por custom')
    })
  })
})
