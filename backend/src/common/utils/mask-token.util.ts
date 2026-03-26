/**
 * Masks a token for logging purposes.
 * In development: returns full token for debugging.
 * In production: returns first 8 and last 4 chars.
 */
export function maskToken(token: string): string {
  if (!token) return 'EMPTY';

  if (process.env.NODE_ENV === 'development') {
    return token;
  }

  if (token.length <= 12) {
    return `${token.substring(0, 4)}...`;
  }

  return `${token.substring(0, 8)}...${token.substring(token.length - 4)}`;
}
