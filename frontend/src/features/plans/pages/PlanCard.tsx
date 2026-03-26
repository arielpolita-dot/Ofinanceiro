import React from 'react'
import { useTranslation } from 'react-i18next'
import { SubscriptionPlan } from '../../../services'
import { billingService } from '../../../services'
import { Button, Badge } from '../../../design-system'
import { CheckIcon, StarIcon } from '../../../components/icons'
import './PlanCard.css'

interface PlanCardProps {
  plan: SubscriptionPlan
  isCurrentPlan: boolean
  isRedirecting: boolean
  onSubscribe: (plan: SubscriptionPlan) => void
}

export const PlanCard = React.memo(function PlanCard({ plan, isCurrentPlan, isRedirecting, onSubscribe }: PlanCardProps) {
  const { t } = useTranslation()
  const isHighlighted = plan.isHighlighted
  const cardClass = `plan-card${isHighlighted ? ' plan-card--highlighted' : ''}`

  const scanLabel = plan.executionCount
    ? t('plans.scansCount', { count: plan.executionCount })
    : t('plans.unlimitedScans')

  return (
    <div className={cardClass}>
      {isHighlighted && (
        <div className="plan-card__badge">
          <StarIcon />
          {t('plans.mostPopular')}
        </div>
      )}

      <div className={`plan-card__header${isHighlighted ? ' plan-card__header--padded' : ''}`}>
        <div className="plan-card__title-row">
          <h3 className="plan-card__name">{plan.name}</h3>
          {isCurrentPlan && (
            <Badge variant="success" size="sm">{t('plans.currentPlan')}</Badge>
          )}
        </div>
        <p className="plan-card__description">{plan.description}</p>
      </div>

      <div className="plan-card__pricing">
        <div className="plan-card__price">
          {billingService.formatPrice(plan.priceCents)}
        </div>
        <div className="plan-card__interval">
          {billingService.formatInterval(plan.interval, plan.intervalCount)}
        </div>
        {plan.trialDays > 0 && (
          <Badge variant="success" size="sm" className="plan-card__trial-badge">
            {t('plans.trialDays', { days: plan.trialDays })}
          </Badge>
        )}
      </div>

      <div className="plan-card__quota">
        <div className="plan-card__quota-box">
          <span className="plan-card__quota-count">{scanLabel}</span>
          <span className="plan-card__quota-interval">
            {billingService.formatInterval(plan.interval, plan.intervalCount)}
          </span>
        </div>
      </div>

      {plan.features && plan.features.length > 0 && (
        <ul className="plan-card__features">
          {plan.features.map((feature, index) => (
            <li key={index} className="plan-card__feature">
              <span className="plan-card__feature-icon">
                <CheckIcon />
              </span>
              {feature}
            </li>
          ))}
        </ul>
      )}

      <Button
        variant={isCurrentPlan ? 'secondary' : isHighlighted ? 'primary' : 'secondary'}
        fullWidth
        onClick={() => onSubscribe(plan)}
        loading={isRedirecting}
        disabled={isCurrentPlan}
      >
        {isCurrentPlan ? t('plans.currentPlanButton') : t('plans.subscribe')}
      </Button>
    </div>
  )
})
