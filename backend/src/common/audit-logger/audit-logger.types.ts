/**
 * Tipos e constantes do módulo de Audit Logger
 */
import { AuditLogLevel, AuditLogEventType } from '../../database/schemas';

/** Parâmetros para criar um log de auditoria */
export interface AuditLogParams {
  level?: AuditLogLevel;
  eventType: AuditLogEventType;
  requestId?: string | null;
  userId?: string | null;
  userEmail?: string | null;
  method?: string | null;
  path?: string | null;
  statusCode?: number | null;
  service?: string | null;
  methodName?: string | null;
  message?: string | null;
  params?: Record<string, unknown> | null;
  result?: Record<string, unknown> | null;
  errorMessage?: string | null;
  errorStack?: string | null;
  errorCode?: string | null;
  durationMs?: number | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
}

/** Campos sensíveis que devem ser removidos dos parâmetros */
export const SENSITIVE_FIELDS = [
  'password',
  'senha',
  'token',
  'accessToken',
  'refreshToken',
  'apiKey',
  'secret',
  'authorization',
  'cookie',
  'creditCard',
  'cardNumber',
  'cvv',
  'ssn',
];

/** Remove campos sensíveis de um objeto (recursivo) */
export function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const isSensitive = SENSITIVE_FIELDS.some(
      (field) => key.toLowerCase().includes(field.toLowerCase()),
    );

    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        item && typeof item === 'object'
          ? sanitizeObject(item as Record<string, unknown>)
          : item,
      );
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/** Extrai mensagem e stack de um Error ou string */
export function extractError(error: Error | string | undefined): { errorMessage?: string; errorStack?: string } {
  if (!error) return {};
  if (typeof error === 'string') return { errorMessage: error };
  return { errorMessage: error.message, errorStack: error.stack };
}
