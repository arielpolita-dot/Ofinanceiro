/**
 * ==============================================================================
 * Hooks - Barrel Export
 * ==============================================================================
 *
 * Exporta todos os hooks customizados do projeto.
 *
 * @module hooks
 */

// Authentication
export { AuthProvider, useAuth } from '../features/auth/hooks/useAuth';

// Company
export { CompanyProvider, useCompany } from '../features/companies/hooks/useCompany';

// Polling
export {
  usePolling,
  type UsePollingOptions,
  type UsePollingReturn,
} from './usePolling';
export {
  useConditionalPolling,
  type UseConditionalPollingOptions,
} from './useConditionalPolling';

// UTM Parameters
export {
  useUtmParams,
  getStoredUtmParams,
  hasUtmParams,
  utmParamsToObject,
  type UtmParams,
} from './useUtmParams';
