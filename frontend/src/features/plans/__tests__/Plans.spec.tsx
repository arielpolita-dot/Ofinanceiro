import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { Plans } from '../pages/Plans'

const mockGetPlans = vi.fn()
const mockGetSubscription = vi.fn()
const mockGetSubscriptionCheckoutUrl = vi.fn()

vi.mock('../../../services', () => ({
  billingService: {
    getPlans: (...args: unknown[]) => mockGetPlans(...args),
    getSubscription: (...args: unknown[]) => mockGetSubscription(...args),
    getSubscriptionCheckoutUrl: (...args: unknown[]) => mockGetSubscriptionCheckoutUrl(...args),
    formatPrice: (cents: number) => `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`,
    formatInterval: (_interval: string, count: number) =>
      count === 1 ? 'por mes' : `a cada ${count} meses`,
  },
}))

vi.mock('../../../services/analytics', () => ({
  trackCtaClickSelectPlan: vi.fn(),
  trackConversionCheckoutStart: vi.fn(),
  trackErrorApi: vi.fn(),
}))

vi.mock('../../../design-system', () => ({
  Page: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Button: ({ children, ...props }: React.ComponentProps<'button'>) => (
    <button {...props}>{children}</button>
  ),
  Card: ({ children, ...props }: React.ComponentProps<'div'>) => <div {...props}>{children}</div>,
  CardHeader: ({ title, description }: { title: string; description?: string }) => (
    <div>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  ),
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Spinner: ({ size }: { size?: string }) => <div data-testid="spinner" data-size={size} />,
  Alert: ({ children, title }: { children: React.ReactNode; title?: string; variant?: string; dismissible?: boolean; onDismiss?: () => void }) => (
    <div role="alert">
      {title && <strong>{title}</strong>}
      {children}
    </div>
  ),
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}))

vi.mock('../pages/PlanCard', () => ({
  PlanCard: ({ plan, isCurrentPlan, onSubscribe }: {
    plan: { id: string; name: string }
    isCurrentPlan: boolean
    isRedirecting: boolean
    onSubscribe: (plan: { id: string; name: string }) => void
  }) => (
    <div data-testid={`plan-card-${plan.id}`}>
      <span>{plan.name}</span>
      {isCurrentPlan && <span>Current</span>}
      <button onClick={() => onSubscribe(plan)}>Subscribe</button>
    </div>
  ),
}))

const mockPlan = {
  id: 'plan-1',
  name: 'Pro',
  description: 'Best plan',
  priceCents: 2990,
  currency: 'BRL',
  interval: 'monthly' as const,
  intervalCount: 1,
  trialDays: 7,
  executionCount: 100,
  features: ['Feature A'],
  isHighlighted: false,
  sortOrder: 1,
  status: 'active',
}

describe('Plans', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows spinner while loading', () => {
    mockGetPlans.mockReturnValue(new Promise(() => {}))
    mockGetSubscription.mockReturnValue(new Promise(() => {}))

    render(<Plans />)
    expect(screen.getByTestId('spinner')).toBeInTheDocument()
  })

  it('renders plans after loading', async () => {
    mockGetPlans.mockResolvedValue([mockPlan])
    mockGetSubscription.mockResolvedValue(null)

    render(<Plans />)

    await waitFor(() => {
      expect(screen.getByTestId('plan-card-plan-1')).toBeInTheDocument()
    })
    expect(screen.getByText('Pro')).toBeInTheDocument()
  })

  it('shows error alert on fetch failure', async () => {
    mockGetPlans.mockRejectedValue(new Error('Network error'))
    mockGetSubscription.mockRejectedValue(new Error('Network error'))

    render(<Plans />)

    await waitFor(() => {
      expect(screen.getByText('plans.loadError')).toBeInTheDocument()
    })
  })

  it('renders empty state when no plans', async () => {
    mockGetPlans.mockResolvedValue([])
    mockGetSubscription.mockResolvedValue(null)

    render(<Plans />)

    await waitFor(() => {
      expect(screen.getByText('plans.noPlans')).toBeInTheDocument()
    })
  })

  it('shows no-subscription alert when user has no subscription', async () => {
    mockGetPlans.mockResolvedValue([mockPlan])
    mockGetSubscription.mockResolvedValue(null)

    render(<Plans />)

    await waitFor(() => {
      expect(
        screen.getByText('plans.noSubscription'),
      ).toBeInTheDocument()
    })
  })

  it('renders page title and subtitle', () => {
    mockGetPlans.mockReturnValue(new Promise(() => {}))
    mockGetSubscription.mockReturnValue(new Promise(() => {}))

    render(<Plans />)

    expect(screen.getByText('plans.title')).toBeInTheDocument()
  })
})
