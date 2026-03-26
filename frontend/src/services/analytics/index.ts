/**
 * Analytics Service - Provider-agnostic Analytics
 *
 * Servico centralizado para tracking de eventos e page views.
 * Usa inversao de dependencia para permitir trocar providers facilmente.
 *
 * ## Padrao de Nomenclatura: categoria_acao_elemento (snake_case)
 *
 * ## Uso
 *
 * ```typescript
 * import { track, trackPage } from './services/analytics'
 *
 * // Rastrear eventos
 * track('cta_click_start_scan', { project_id: '123' })
 * trackPage('dashboard')
 * ```
 */

// Core: init, track, trackPage, setUserId, etc.
export {
  initAnalytics,
  trackPage,
  trackPageView,
  track,
  trackEvent,
  setUserId,
  setAnalyticsUserId,
  setAnalyticsUserProperties,
} from './analytics.core'

// Event constants and type
export { AnalyticsEvents, type AnalyticsEventName } from './analytics.events'

// Tracking: Auth, Projects, Billing/Conversion
export {
  trackAuthLoginStart,
  trackAuthLoginSuccess,
  trackAuthLoginError,
  trackAuthLogout,
  trackLogin,
  trackLogout,
  trackFeatureProjectCreate,
  trackFeatureProjectUpdate,
  trackFeatureProjectDelete,
  trackNavClickProject,
  trackCtaClickNewProject,
  trackProjectCreate,
  trackProjectView,
  trackCtaClickSelectPlan,
  trackConversionCheckoutStart,
  trackConversionCheckoutSuccess,
  trackCtaClickBuyCredits,
  trackConversionPaymentConfirmed,
  trackConversionPaymentSuccess,
  trackPlanSelect,
  trackCheckoutStart,
  trackCheckoutComplete,
} from './analytics.tracking'

// Funnel: Trial, Dashboard, Feedback, Email
export {
  trackFunnelTrialPageView,
  trackFunnelTrialFormStart,
  trackFunnelTrialFormSubmit,
  trackFunnelTrialStarted,
  trackFunnelTrialResultView,
  trackFunnelTrialClickRegister,
  trackFunnelTrialClickLogin,
  trackFunnelTrialClickRetry,
  trackNavDashboardRefresh,
  trackNavDashboardNewProject,
  trackNavDashboardViewAll,
  trackNavDashboardProject,
  trackCtaFeedbackNewIssue,
  trackCtaFeedbackNewSuggestion,
  trackNavFeedbackTab,
  trackFeatureFeedbackSubmit,
  trackFeatureFeedbackDelete,
  trackTrialStart,
  trackTrialComplete,
  trackEmailLinkClicked,
} from './analytics.funnel'

// Errors, CTA/Engagement, Feedback forms, Scheduling
export {
  trackErrorApi,
  trackErrorValidation,
  trackErrorAuth,
  trackError,
  trackCtaClick,
  trackFeatureUse,
  trackNavClick,
  trackFormStartFeedback,
  trackFormSubmitFeedback,
  trackFeatureScheduleCreate,
  trackFeatureScheduleUpdate,
  trackFeatureScheduleDelete,
} from './analytics.unlock-errors'

// Re-export types
export type { AnalyticsProvider, EventParams } from './analytics.interface'
