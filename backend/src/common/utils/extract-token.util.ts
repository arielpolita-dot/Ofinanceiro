import { Request } from 'express';

const COOKIE_NAME = 'app_access_token';

/**
 * Extracts access token from httpOnly cookie (priority) or Authorization header (fallback).
 * Cookie is preferred as it is protected against XSS.
 */
export function extractToken(req: Request): string | null {
  const cookieToken = req.cookies?.[COOKIE_NAME];
  if (cookieToken) return cookieToken;

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) return authHeader.substring(7);

  return null;
}

/**
 * Returns the token source for logging purposes.
 */
export function getTokenSource(req: Request): 'cookie' | 'bearer' | null {
  if (req.cookies?.[COOKIE_NAME]) return 'cookie';
  if (req.headers.authorization?.startsWith('Bearer ')) return 'bearer';
  return null;
}
