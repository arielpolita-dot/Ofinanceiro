/**
 * Wraps fetch with an AbortController timeout.
 * Default timeout: 10 seconds.
 */
export async function fetchWithTimeout(
  url: string | URL | Request,
  options?: RequestInit,
  timeoutMs = 10_000,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}
