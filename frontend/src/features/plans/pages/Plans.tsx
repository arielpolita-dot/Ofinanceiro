import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { logger } from '../../../utils/logger'
import { billingService, SubscriptionPlan, Subscription } from '../../../services'
import {
  trackCtaClickSelectPlan,
  trackConversionCheckoutStart,
  trackErrorApi,
} from '../../../services/analytics'
import {
  Page,
  Card,
  CardHeader,
  CardContent,
  Spinner,
  Alert,
  Badge,
} from '../../../design-system'
import { CrownIcon } from '../../../components/icons'
import { PlanCard } from './PlanCard'
import './Plans.css'

export function Plans() {
  const { t } = useTranslation()
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [plansData, subscriptionData] = await Promise.all([
        billingService.getPlans(),
        billingService.getSubscription(),
      ])
      setPlans(plansData.sort((a, b) => a.sortOrder - b.sortOrder))
      setSubscription(subscriptionData)
    } catch (err) {
      setError(t('plans.loadError'))
      logger.error('Failed to load plans:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    setIsRedirecting(true)
    trackCtaClickSelectPlan(plan.id, plan.name)
    trackConversionCheckoutStart('plan', plan.id, plan.priceCents / 100)
    try {
      const { url } = await billingService.getSubscriptionCheckoutUrl()
      window.location.href = url
    } catch {
      setError(t('plans.checkoutError'))
      trackErrorApi('/billing/checkout', 500, t('plans.checkoutError'))
      setIsRedirecting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variantMap: Record<string, 'success' | 'warning' | 'danger' | 'primary'> = {
      active: 'success',
      trialing: 'primary',
      past_due: 'warning',
      canceled: 'danger',
      expired: 'danger',
    }
    const keyMap: Record<string, string> = {
      active: 'plans.statusActive',
      trialing: 'plans.statusTrialing',
      past_due: 'plans.statusPastDue',
      canceled: 'plans.statusCanceled',
      expired: 'plans.statusExpired',
    }
    const variant = variantMap[status] || 'primary'
    const label = keyMap[status] ? t(keyMap[status]) : status
    return <Badge variant={variant}>{label}</Badge>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  return (
    <Page>
      <header className="page-header">
        <div>
          <h1>{t('plans.title')}</h1>
          <p>{t('plans.description')}</p>
        </div>
      </header>

      {error && (
        <Alert variant="danger" title={t('common.error')} dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {isLoading ? (
        <div className="plans-loading">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {subscription && (
            <SubscriptionCard
              subscription={subscription}
              getStatusBadge={getStatusBadge}
              formatDate={formatDate}
            />
          )}

          {!subscription && plans.length > 0 && (
            <Alert variant="info" title={t('plans.noSubscription')} className="plans-section-gap">
              {t('plans.noSubscriptionDescription')}
            </Alert>
          )}

          <PlansGrid
            plans={plans}
            subscription={subscription}
            isRedirecting={isRedirecting}
            onSubscribe={handleSubscribe}
          />
        </>
      )}
    </Page>
  )
}

function SubscriptionCard({
  subscription,
  getStatusBadge,
  formatDate,
}: {
  subscription: Subscription
  getStatusBadge: (status: string) => React.ReactNode
  formatDate: (date: string) => string
}) {
  const { t } = useTranslation()

  const scanLabel = subscription.plan.executionCount
    ? `${subscription.plan.executionCount} scans ${billingService.formatInterval(subscription.plan.interval, subscription.plan.intervalCount)}`
    : t('plans.unlimitedScans')

  return (
    <Card className="plans-section-gap">
      <CardContent>
        <div className="plans-subscription-info">
          <div className="plans-subscription-left">
            <div className="plans-subscription-icon">
              <CrownIcon />
            </div>
            <div>
              <div className="plans-subscription-name-row">
                <span className="plans-subscription-name">
                  {subscription.plan.name}
                </span>
                {getStatusBadge(subscription.status)}
              </div>
              <div className="plans-subscription-detail">
                {scanLabel}
              </div>
            </div>
          </div>
          <div className="plans-subscription-right">
            <div className="plans-subscription-due-label">{t('plans.nextDue')}</div>
            <div className="plans-subscription-due-date">
              {formatDate(subscription.currentPeriodEnd)}
            </div>
            {subscription.cancelAtPeriodEnd && (
              <Badge variant="warning" size="sm" className="plans-cancel-badge">
                {t('plans.cancelAtPeriodEnd')}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function PlansGrid({
  plans,
  subscription,
  isRedirecting,
  onSubscribe,
}: {
  plans: SubscriptionPlan[]
  subscription: Subscription | null
  isRedirecting: boolean
  onSubscribe: (plan: SubscriptionPlan) => void
}) {
  const { t } = useTranslation()

  return (
    <Card>
      <CardHeader title={t('plans.availablePlans')} description={t('plans.availablePlansDescription')} />
      <CardContent>
        {plans.length === 0 ? (
          <div className="plans-empty">
            <p>{t('plans.noPlans')}</p>
          </div>
        ) : (
          <div className="plans-grid">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isCurrentPlan={subscription?.planId === plan.id}
                isRedirecting={isRedirecting}
                onSubscribe={onSubscribe}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
