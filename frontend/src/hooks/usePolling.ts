/**
 * usePolling - Hook reutilizavel para polling de dados com setTimeout.
 * Pausa automatica quando tab nao esta visivel, controle manual start/stop.
 */
import { useEffect, useRef, useCallback, useState } from 'react';
import { logger } from '../utils/logger';

export interface UsePollingOptions {
  interval: number;
  enabled?: boolean;
  onError?: (error: Error) => void;
  immediate?: boolean;
  maxRetries?: number;
  backoffMultiplier?: number;
  maxBackoffInterval?: number;
}

export interface UsePollingReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
  isPolling: boolean;
}

interface PollingState<T> {
  fetcher: () => Promise<T>;
  interval: number;
  enabled: boolean;
  onError?: (error: Error) => void;
  maxRetries: number;
  backoffMultiplier: number;
  maxBackoffInterval: number;
  immediate: boolean;
  isMounted: boolean;
  isPolling: boolean;
  retryCount: number;
  currentInterval: number;
  timeoutId: ReturnType<typeof setTimeout> | null;
  initialFetchDone: boolean;
  enabledAtMount: boolean;
}

/** Cria funcao de fetch recursiva com schedule do proximo poll */
function createRecursiveFetch<T>(
  s: PollingState<T>,
  setData: (d: T) => void,
  setError: (e: Error | null) => void,
  setIsLoading: (b: boolean) => void,
  setIsPolling: (b: boolean) => void,
  handle429 = false,
): () => Promise<void> {
  const doFetch = async () => {
    if (!s.isMounted || !s.isPolling) return;

    try {
      setIsLoading(true);
      const result = await s.fetcher();
      if (s.isMounted) {
        setData(result);
        setError(null);
        s.retryCount = 0;
        s.currentInterval = s.interval;
      }
    } catch (err) {
      if (s.isMounted) {
        const error = err instanceof Error ? err : new Error('Unknown error');

        if (handle429 && isRateLimited(error)) {
          s.retryCount++;
          s.currentInterval = Math.min(
            s.currentInterval * s.backoffMultiplier,
            s.maxBackoffInterval,
          );
          logger.warn(
            `[usePolling] Rate limited (429). Retry ${s.retryCount}/${s.maxRetries}. ` +
            `Next attempt in ${s.currentInterval / 1000}s`,
          );
          if (s.retryCount >= s.maxRetries) {
            logger.error('[usePolling] Max retries exceeded. Stopping polling.');
            setError(new Error('Taxa de requisicoes excedida. Tente novamente em alguns minutos.'));
            s.onError?.(error);
            s.isPolling = false;
            setIsPolling(false);
            return;
          }
        } else {
          setError(error);
          s.onError?.(error);
        }
      }
    } finally {
      if (s.isMounted) setIsLoading(false);
    }

    if (s.isMounted && s.isPolling) {
      s.timeoutId = setTimeout(doFetch, s.currentInterval);
    }
  };
  return doFetch;
}

function isRateLimited(error: Error): boolean {
  return error.message.includes('429') ||
    error.message.includes('Too Many Requests') ||
    error.message.includes('rate limit');
}

function clearPollingTimeout<T>(s: PollingState<T>) {
  if (s.timeoutId) {
    clearTimeout(s.timeoutId);
    s.timeoutId = null;
  }
}

function initPollingState<T>(s: PollingState<T>, setIsPolling: (b: boolean) => void) {
  s.retryCount = 0;
  s.currentInterval = s.interval;
  s.isPolling = true;
  setIsPolling(true);
}

export function usePolling<T>(
  fetcher: () => Promise<T>,
  options: UsePollingOptions,
): UsePollingReturn<T> {
  const {
    interval, enabled = true, onError, immediate = true,
    maxRetries = 5, backoffMultiplier = 2, maxBackoffInterval = 30000,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const stateRef = useRef<PollingState<T>>({
    fetcher, interval, enabled, onError, maxRetries,
    backoffMultiplier, maxBackoffInterval, immediate,
    isMounted: true, isPolling: false, retryCount: 0,
    currentInterval: interval, timeoutId: null,
    initialFetchDone: false, enabledAtMount: enabled,
  });

  // Sync refs on every render
  const s = stateRef.current;
  s.fetcher = fetcher;
  s.interval = interval;
  s.enabled = enabled;
  s.onError = onError;
  s.maxRetries = maxRetries;
  s.backoffMultiplier = backoffMultiplier;
  s.maxBackoffInterval = maxBackoffInterval;
  s.immediate = immediate;

  const stopPolling = useCallback(() => {
    s.isPolling = false;
    clearPollingTimeout(s);
    setIsPolling(false);
  }, []);

  const startPolling = useCallback(() => {
    if (s.isPolling) return;
    initPollingState(s, setIsPolling);
    const doFetch = createRecursiveFetch(s, setData, setError, setIsLoading, setIsPolling);
    doFetch();
  }, []);

  const refetch = useCallback(async () => {
    const wasPolling = s.isPolling;
    s.isPolling = true;
    s.retryCount = 0;
    s.currentInterval = s.interval;
    try {
      setIsLoading(true);
      const result = await s.fetcher();
      if (s.isMounted) { setData(result); setError(null); }
    } catch (err) {
      if (s.isMounted) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        s.onError?.(error);
      }
    } finally {
      if (s.isMounted) setIsLoading(false);
      if (!wasPolling) s.isPolling = false;
    }
  }, []);

  // Track mounted state
  useEffect(() => {
    s.isMounted = true;
    return () => { s.isMounted = false; clearPollingTimeout(s); };
  }, []);

  // Main effect - start/stop polling based on enabled
  useEffect(() => {
    if (!enabled) {
      if (s.isPolling) { s.isPolling = false; clearPollingTimeout(s); setIsPolling(false); }
      s.retryCount = 0;
      s.currentInterval = s.interval;
      s.initialFetchDone = false;
      return;
    }
    if (s.isPolling) return;

    initPollingState(s, setIsPolling);
    const doFetch = createRecursiveFetch(s, setData, setError, setIsLoading, setIsPolling, true);

    if (s.immediate) {
      doFetch();
    } else {
      s.timeoutId = setTimeout(doFetch, s.interval);
    }

    return () => { s.isPolling = false; clearPollingTimeout(s); };
  }, [enabled]);

  // Pause/resume on tab visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearPollingTimeout(s);
        s.isPolling = false;
        setIsPolling(false);
      } else if (s.enabled && !s.isPolling) {
        initPollingState(s, setIsPolling);
        const doFetch = createRecursiveFetch(s, setData, setError, setIsLoading, setIsPolling);
        doFetch();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return { data, isLoading, error, refetch, startPolling, stopPolling, isPolling };
}
