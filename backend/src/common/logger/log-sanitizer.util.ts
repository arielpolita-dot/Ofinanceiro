const SENSITIVE_FIELDS = new Set([
  'password',
  'token',
  'apikey',
  'api_key',
  'secret',
  'creditcard',
  'credit_card',
  'cpf',
  'ssn',
  'authorization',
  'refreshtoken',
  'refresh_token',
  'accesstoken',
  'access_token',
]);

const REDACTED = '[REDACTED]';
const MAX_DEPTH = 10;

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_FIELDS.has(key.toLowerCase());
}

function sanitizeValue(value: unknown, depth: number): unknown {
  if (depth > MAX_DEPTH) return value;

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, depth + 1));
  }

  if (value !== null && typeof value === 'object') {
    return sanitizeObject(value as Record<string, unknown>, depth + 1);
  }

  return value;
}

function sanitizeObject(
  obj: Record<string, unknown>,
  depth: number,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const key of Object.keys(obj)) {
    if (isSensitiveKey(key)) {
      result[key] = REDACTED;
    } else {
      result[key] = sanitizeValue(obj[key], depth);
    }
  }

  return result;
}

export function sanitizeLogData(data: unknown): unknown {
  if (data === null || data === undefined) return data;

  if (typeof data === 'string') return data;
  if (typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeValue(item, 0));
  }

  return sanitizeObject(data as Record<string, unknown>, 0);
}
