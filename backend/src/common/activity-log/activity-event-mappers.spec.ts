import { mapEventToAction, mapCategoryToResource } from './activity-event-mappers';
import { ActivityAction, ActivityResource } from '../../database/entities';

describe('activity-event-mappers', () => {
  describe('mapEventToAction', () => {
    it.each([
      ['auth_login', ActivityAction.LOGIN],
      ['auth_logout', ActivityAction.LOGOUT],
      ['error_api', ActivityAction.ERROR_API],
      ['error_validation', ActivityAction.ERROR_VALIDATION],
      ['error_auth', ActivityAction.ERROR_AUTH],
      ['error_payment', ActivityAction.ERROR_PAYMENT],
      ['error_unknown', ActivityAction.ERROR_UNKNOWN],
      ['conversion_checkout_start', ActivityAction.CONVERSION_CHECKOUT_START],
      ['nav_page_view', ActivityAction.NAV_PAGE_VIEW],
      ['nav_click', ActivityAction.NAV_CLICK],
      ['cta_click', ActivityAction.CTA_CLICK],
      ['billing_checkout_start', ActivityAction.BILLING_CHECKOUT_START],
    ])('should map "%s" to %s', (eventName, expected) => {
      expect(mapEventToAction(eventName)).toBe(expected);
    });

    it('should return FRONTEND_EVENT for unknown events', () => {
      expect(mapEventToAction('unknown_event')).toBe(ActivityAction.FRONTEND_EVENT);
    });

    it('should return FRONTEND_EVENT for empty string', () => {
      expect(mapEventToAction('')).toBe(ActivityAction.FRONTEND_EVENT);
    });

    it('should be case-sensitive', () => {
      expect(mapEventToAction('AUTH_LOGIN')).toBe(ActivityAction.FRONTEND_EVENT);
    });
  });

  describe('mapCategoryToResource', () => {
    describe('prefix matching', () => {
      it.each([
        ['nav_click_something', ActivityResource.NAVIGATION],
        ['cta_click_buy', ActivityResource.CTA],
        ['auth_login', ActivityResource.AUTH],
        ['error_api', ActivityResource.SYSTEM],
      ])('should map prefix "%s" to %s', (category, expected) => {
        expect(mapCategoryToResource(category)).toBe(expected);
      });
    });

    describe('contains matching', () => {
      it.each([
        ['some_billing_event', ActivityResource.BILLING],
        ['conversion_checkout_start', ActivityResource.BILLING],
      ])('should map keyword in "%s" to %s', (category, expected) => {
        const result = mapCategoryToResource(category);
        expect(result).toBe(expected);
      });
    });

    it('should return FRONTEND for unmatched category', () => {
      expect(mapCategoryToResource('random_unknown_event')).toBe(
        ActivityResource.FRONTEND,
      );
    });

    it('should return FRONTEND for empty string', () => {
      expect(mapCategoryToResource('')).toBe(ActivityResource.FRONTEND);
    });

    it('should prioritize prefix over contains match', () => {
      // "nav_" prefix should match before any keyword
      const result = mapCategoryToResource('nav_billing_something');
      expect(result).toBe(ActivityResource.NAVIGATION);
    });
  });
});
