import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PlanCard } from '../pages/PlanCard'
import type { SubscriptionPlan } from '../../../services'

vi.mock('../../../services', () => ({
  billingService: {
    formatPrice: (cents: number) => `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`,
    formatInterval: (_interval: string, count: number) =>
      count === 1 ? 'por mes' : `a cada ${count} meses`,
  },
}))

vi.mock('../../../design-system', () => ({
  Button: ({ children, onClick, disabled, ...props }: React.ComponentProps<'button'> & { fullWidth?: boolean; loading?: boolean }) => (
    <button onClick={onClick} disabled={disabled} {...props}>{children}</button>
  ),
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}))

const basePlan: SubscriptionPlan = {
  id: 'plan-1',
  name: 'Pro Plan',
  description: 'For professionals',
  priceCents: 4990,
  currency: 'BRL',
  interval: 'monthly',
  intervalCount: 1,
  trialDays: 0,
  executionCount: 200,
  features: ['Feature A', 'Feature B'],
  isHighlighted: false,
  sortOrder: 1,
  status: 'active',
}

describe('PlanCard', () => {
  it('renders plan name and description', () => {
    render(
      <PlanCard plan={basePlan} isCurrentPlan={false} isRedirecting={false} onSubscribe={vi.fn()} />,
    )
    expect(screen.getByText('Pro Plan')).toBeInTheDocument()
    expect(screen.getByText('For professionals')).toBeInTheDocument()
  })

  it('renders formatted price', () => {
    render(
      <PlanCard plan={basePlan} isCurrentPlan={false} isRedirecting={false} onSubscribe={vi.fn()} />,
    )
    expect(screen.getByText('R$ 49,90')).toBeInTheDocument()
  })

  it('renders features list', () => {
    render(
      <PlanCard plan={basePlan} isCurrentPlan={false} isRedirecting={false} onSubscribe={vi.fn()} />,
    )
    expect(screen.getByText('Feature A')).toBeInTheDocument()
    expect(screen.getByText('Feature B')).toBeInTheDocument()
  })

  it('shows "Atual" badge when is current plan', () => {
    render(
      <PlanCard plan={basePlan} isCurrentPlan={true} isRedirecting={false} onSubscribe={vi.fn()} />,
    )
    expect(screen.getByText('plans.currentPlan')).toBeInTheDocument()
    expect(screen.getByText('plans.currentPlanButton')).toBeInTheDocument()
  })

  it('shows "Assinar" button when not current plan', () => {
    render(
      <PlanCard plan={basePlan} isCurrentPlan={false} isRedirecting={false} onSubscribe={vi.fn()} />,
    )
    expect(screen.getByText('plans.subscribe')).toBeInTheDocument()
  })

  it('calls onSubscribe when button clicked', () => {
    const onSubscribe = vi.fn()
    render(
      <PlanCard plan={basePlan} isCurrentPlan={false} isRedirecting={false} onSubscribe={onSubscribe} />,
    )
    fireEvent.click(screen.getByText('plans.subscribe'))
    expect(onSubscribe).toHaveBeenCalledWith(basePlan)
  })

  it('disables button for current plan', () => {
    render(
      <PlanCard plan={basePlan} isCurrentPlan={true} isRedirecting={false} onSubscribe={vi.fn()} />,
    )
    expect(screen.getByText('plans.currentPlanButton')).toBeDisabled()
  })

  it('shows "Mais popular" when highlighted', () => {
    const highlighted = { ...basePlan, isHighlighted: true }
    render(
      <PlanCard plan={highlighted} isCurrentPlan={false} isRedirecting={false} onSubscribe={vi.fn()} />,
    )
    expect(screen.getByText('plans.mostPopular')).toBeInTheDocument()
  })

  it('shows trial badge when trialDays > 0', () => {
    const withTrial = { ...basePlan, trialDays: 14 }
    render(
      <PlanCard plan={withTrial} isCurrentPlan={false} isRedirecting={false} onSubscribe={vi.fn()} />,
    )
    expect(screen.getByText('plans.trialDays')).toBeInTheDocument()
  })

  it('shows "Scans ilimitados" when executionCount is null', () => {
    const unlimited = { ...basePlan, executionCount: null }
    render(
      <PlanCard plan={unlimited} isCurrentPlan={false} isRedirecting={false} onSubscribe={vi.fn()} />,
    )
    expect(screen.getByText('plans.unlimitedScans')).toBeInTheDocument()
  })

  it('shows execution count when set', () => {
    render(
      <PlanCard plan={basePlan} isCurrentPlan={false} isRedirecting={false} onSubscribe={vi.fn()} />,
    )
    expect(screen.getByText('plans.scansCount')).toBeInTheDocument()
  })
})
