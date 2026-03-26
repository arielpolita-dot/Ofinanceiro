/**
 * useConditionalPolling - Polling que para automaticamente quando uma condicao e atingida.
 */
import { useEffect, useRef, useState } from 'react';
import { usePolling, UsePollingOptions, UsePollingReturn } from './usePolling';

export interface UseConditionalPollingOptions<T> extends UsePollingOptions {
  shouldContinue: (data: T | null) => boolean;
}

export function useConditionalPolling<T>(
  fetcher: () => Promise<T>,
  options: UseConditionalPollingOptions<T>
): UsePollingReturn<T> {
  const { shouldContinue, ...pollingOptions } = options;

  const [internalEnabled, setInternalEnabled] = useState(true);
  const hasStoppedRef = useRef(false);
  const prevEnabledRef = useRef(pollingOptions.enabled);

  const externalEnabled = pollingOptions.enabled ?? true;
  const effectiveEnabled = externalEnabled && internalEnabled;

  const result = usePolling(fetcher, {
    ...pollingOptions,
    enabled: effectiveEnabled,
  });

  // Quando receber dados, verificar se deve parar
  useEffect(() => {
    if (result.data !== null && !shouldContinue(result.data)) {
      if (!hasStoppedRef.current) {
        hasStoppedRef.current = true;
        setInternalEnabled(false);
      }
    }
  }, [result.data, shouldContinue]);

  // Se o enabled externo mudar de false para true, resetar o estado interno
  useEffect(() => {
    const wasDisabled = prevEnabledRef.current === false;
    const isNowEnabled = externalEnabled === true;

    if (wasDisabled && isNowEnabled) {
      hasStoppedRef.current = false;
      setInternalEnabled(true);
    }

    prevEnabledRef.current = pollingOptions.enabled;
  }, [externalEnabled, pollingOptions.enabled]);

  return result;
}
