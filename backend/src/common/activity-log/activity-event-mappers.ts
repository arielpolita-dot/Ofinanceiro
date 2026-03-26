/** Mappers de eventos frontend -> ActivityAction/ActivityResource */
import { ActivityAction, ActivityResource } from '../../database/entities';

const EVENT_TO_ACTION: Record<string, ActivityAction> = {
  // Auth
  'auth_login': ActivityAction.LOGIN,
  'auth_logout': ActivityAction.LOGOUT,
  // Navigation
  'nav_page_view': ActivityAction.NAV_PAGE_VIEW,
  'nav_click': ActivityAction.NAV_CLICK,
  // CTA
  'cta_click': ActivityAction.CTA_CLICK,
  // Billing/Conversion
  'conversion_checkout_start': ActivityAction.CONVERSION_CHECKOUT_START,
  'billing_checkout_start': ActivityAction.BILLING_CHECKOUT_START,
  // Errors
  'error_api': ActivityAction.ERROR_API,
  'error_validation': ActivityAction.ERROR_VALIDATION,
  'error_auth': ActivityAction.ERROR_AUTH,
  'error_payment': ActivityAction.ERROR_PAYMENT,
  'error_unknown': ActivityAction.ERROR_UNKNOWN,
};

/** Mapeia eventName do frontend para ActivityAction */
export function mapEventToAction(eventName: string): ActivityAction {
  return EVENT_TO_ACTION[eventName] || ActivityAction.FRONTEND_EVENT;
}

const CATEGORY_PREFIX_MAP: [string, ActivityResource][] = [
  ['nav_', ActivityResource.NAVIGATION],
  ['cta_', ActivityResource.CTA],
  ['auth_', ActivityResource.AUTH],
  ['error_', ActivityResource.SYSTEM],
];

const CATEGORY_CONTAINS_MAP: [string, ActivityResource][] = [
  ['billing', ActivityResource.BILLING],
  ['checkout', ActivityResource.BILLING],
];

/** Mapeia categoria do evento para ActivityResource */
export function mapCategoryToResource(category: string): ActivityResource {
  for (const [prefix, resource] of CATEGORY_PREFIX_MAP) {
    if (category.startsWith(prefix)) return resource;
  }
  for (const [keyword, resource] of CATEGORY_CONTAINS_MAP) {
    if (category.includes(keyword)) return resource;
  }
  return ActivityResource.FRONTEND;
}
