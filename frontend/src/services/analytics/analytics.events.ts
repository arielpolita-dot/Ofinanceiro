/**
 * Analytics Event Names
 *
 * Padrao de Nomenclatura: categoria_acao_elemento (snake_case)
 *
 * Categorias:
 * - page_    -> visualizacao de paginas
 * - auth_    -> autenticacao (login, signup, logout)
 * - nav_     -> navegacao entre secoes
 * - cta_     -> cliques em call-to-action
 * - form_    -> interacoes com formularios
 * - feature_ -> uso de funcionalidades
 * - error_   -> erros e excecoes
 * - conversion_ -> eventos de conversao/pagamento
 * - funnel_  -> eventos de funil de conversao
 */

export const AnalyticsEvents = {
  // -------------------------------------------------------------------------
  // PAGE - Visualizacao de paginas
  // -------------------------------------------------------------------------
  PAGE_VIEW_DASHBOARD: 'page_view_dashboard',
  PAGE_VIEW_PROJECTS: 'page_view_projects',
  PAGE_VIEW_PROJECT_DETAIL: 'page_view_project_detail',
  PAGE_VIEW_PLANS: 'page_view_plans',
  PAGE_VIEW_CREDITS: 'page_view_credits',
  PAGE_VIEW_FEEDBACK: 'page_view_feedback',
  PAGE_VIEW_TRIAL: 'page_view_trial',
  PAGE_VIEW_TRIAL_RESULT: 'page_view_trial_result',

  // -------------------------------------------------------------------------
  // AUTH - Autenticacao
  // -------------------------------------------------------------------------
  AUTH_LOGIN_START: 'auth_login_start',
  AUTH_LOGIN_SUCCESS: 'auth_login_success',
  AUTH_LOGIN_ERROR: 'auth_login_error',
  AUTH_LOGOUT: 'auth_logout',
  AUTH_SIGNUP_START: 'auth_signup_start',
  AUTH_SIGNUP_SUCCESS: 'auth_signup_success',
  AUTH_SESSION_EXPIRED: 'auth_session_expired',

  // -------------------------------------------------------------------------
  // NAV - Navegacao
  // -------------------------------------------------------------------------
  NAV_CLICK_SIDEBAR: 'nav_click_sidebar',
  NAV_CLICK_PROJECT: 'nav_click_project',
  NAV_CLICK_TAB: 'nav_click_tab',
  NAV_CLICK_BACK: 'nav_click_back',

  // -------------------------------------------------------------------------
  // CTA - Call to Action
  // -------------------------------------------------------------------------
  CTA_CLICK_NEW_PROJECT: 'cta_click_new_project',
  CTA_CLICK_BUY_CREDITS: 'cta_click_buy_credits',
  CTA_CLICK_SELECT_PLAN: 'cta_click_select_plan',
  CTA_CLICK_UPGRADE: 'cta_click_upgrade',
  CTA_CLICK_SUBMIT_FEEDBACK: 'cta_click_submit_feedback',
  CTA_CLICK_START_TRIAL: 'cta_click_start_trial',

  // -------------------------------------------------------------------------
  // FORM - Interacoes com formularios
  // -------------------------------------------------------------------------
  FORM_START_PROJECT: 'form_start_project',
  FORM_SUBMIT_PROJECT: 'form_submit_project',
  FORM_START_FEEDBACK: 'form_start_feedback',
  FORM_SUBMIT_FEEDBACK: 'form_submit_feedback',
  FORM_START_TRIAL: 'form_start_trial',
  FORM_SUBMIT_TRIAL: 'form_submit_trial',
  FORM_VALIDATION_ERROR: 'form_validation_error',

  // -------------------------------------------------------------------------
  // FEATURE - Uso de funcionalidades
  // -------------------------------------------------------------------------
  FEATURE_PROJECT_CREATE: 'feature_project_create',
  FEATURE_PROJECT_UPDATE: 'feature_project_update',
  FEATURE_PROJECT_DELETE: 'feature_project_delete',
  FEATURE_SCHEDULE_CREATE: 'feature_schedule_create',
  FEATURE_SCHEDULE_UPDATE: 'feature_schedule_update',
  FEATURE_SCHEDULE_DELETE: 'feature_schedule_delete',

  // -------------------------------------------------------------------------
  // CONVERSION - Eventos de conversao/pagamento
  // -------------------------------------------------------------------------
  CONVERSION_CHECKOUT_START: 'conversion_checkout_start',
  CONVERSION_CHECKOUT_SUCCESS: 'conversion_checkout_success',
  CONVERSION_CHECKOUT_CANCEL: 'conversion_checkout_cancel',
  CONVERSION_PLAN_UPGRADE: 'conversion_plan_upgrade',
  CONVERSION_CREDITS_PURCHASE: 'conversion_credits_purchase',
  CONVERSION_TRIAL_TO_PAID: 'conversion_trial_to_paid',
  CONVERSION_PAYMENT_CONFIRMED: 'conversion_payment_confirmed',
  CONVERSION_PAYMENT_SUCCESS: 'conversion_payment_success',

  // -------------------------------------------------------------------------
  // FUNNEL - Funil de conversao (fluxo trial -> pagamento)
  // -------------------------------------------------------------------------
  FUNNEL_TRIAL_PAGE_VIEW: 'funnel_trial_page_view',
  FUNNEL_TRIAL_FORM_START: 'funnel_trial_form_start',
  FUNNEL_TRIAL_FORM_SUBMIT: 'funnel_trial_form_submit',
  FUNNEL_TRIAL_STARTED: 'funnel_trial_started',
  FUNNEL_TRIAL_RESULT_VIEW: 'funnel_trial_result_view',
  FUNNEL_TRIAL_CLICK_REGISTER: 'funnel_trial_click_register',
  FUNNEL_TRIAL_CLICK_LOGIN: 'funnel_trial_click_login',
  FUNNEL_TRIAL_CLICK_RETRY: 'funnel_trial_click_retry',

  // -------------------------------------------------------------------------
  // DASHBOARD
  // -------------------------------------------------------------------------
  NAV_CLICK_DASHBOARD_REFRESH: 'nav_click_dashboard_refresh',
  NAV_CLICK_DASHBOARD_NEW_PROJECT: 'nav_click_dashboard_new_project',
  NAV_CLICK_DASHBOARD_VIEW_ALL: 'nav_click_dashboard_view_all',
  NAV_CLICK_DASHBOARD_PROJECT: 'nav_click_dashboard_project',

  // -------------------------------------------------------------------------
  // FEEDBACK
  // -------------------------------------------------------------------------
  CTA_CLICK_FEEDBACK_NEW_ISSUE: 'cta_click_feedback_new_issue',
  CTA_CLICK_FEEDBACK_NEW_SUGGESTION: 'cta_click_feedback_new_suggestion',
  NAV_CLICK_FEEDBACK_TAB: 'nav_click_feedback_tab',
  FEATURE_FEEDBACK_SUBMIT: 'feature_feedback_submit',
  FEATURE_FEEDBACK_DELETE: 'feature_feedback_delete',

  // -------------------------------------------------------------------------
  // EMAIL
  // -------------------------------------------------------------------------
  EMAIL_LINK_CLICKED: 'email_link_clicked',

  // -------------------------------------------------------------------------
  // ERROR - Erros e excecoes
  // -------------------------------------------------------------------------
  ERROR_API: 'error_api',
  ERROR_VALIDATION: 'error_validation',
  ERROR_AUTH: 'error_auth',
  ERROR_UNKNOWN: 'error_unknown',
} as const

export type AnalyticsEventName = typeof AnalyticsEvents[keyof typeof AnalyticsEvents]
