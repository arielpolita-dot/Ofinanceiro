/**
 * Hook para capturar e persistir UTM parameters
 *
 * Captura utm_source, utm_medium, utm_campaign, utm_content e utm_term
 * da URL e persiste em sessionStorage para uso em todas as páginas.
 *
 * Exemplo de URL de campanha:
 * example.com/page?utm_source=meta&utm_medium=retargeting&utm_campaign=video_v5
 */

import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

export interface UtmParams {
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  utm_content: string | null
  utm_term: string | null
}

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const
const STORAGE_KEY = 'app_utm_params'

/**
 * Obtém UTM params do sessionStorage
 */
export function getStoredUtmParams(): UtmParams {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {
    // Ignora erros de parsing
  }

  return {
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_content: null,
    utm_term: null,
  }
}

/**
 * Salva UTM params no sessionStorage
 */
function storeUtmParams(params: UtmParams): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(params))
  } catch {
    // Ignora erros de storage (ex: modo privado)
  }
}

/**
 * Hook que captura UTM params da URL e persiste em sessionStorage
 *
 * - Na primeira visita, captura UTMs da URL e salva
 * - Em páginas subsequentes, mantém os UTMs originais
 * - Se novos UTMs vierem na URL, sobrescreve os anteriores
 *
 * @returns UTM params atuais (da URL ou sessionStorage)
 */
export function useUtmParams(): UtmParams {
  const [searchParams] = useSearchParams()

  // Extrai UTM params da URL atual
  const urlUtmParams = useMemo(() => {
    const params: UtmParams = {
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_content: null,
      utm_term: null,
    }

    for (const key of UTM_KEYS) {
      const value = searchParams.get(key)
      if (value) {
        params[key] = value
      }
    }

    return params
  }, [searchParams])

  // Verifica se tem algum UTM na URL
  const hasUrlUtm = useMemo(() => {
    return UTM_KEYS.some((key) => urlUtmParams[key] !== null)
  }, [urlUtmParams])

  // Efeito para persistir UTMs
  useEffect(() => {
    if (hasUrlUtm) {
      // Se tem UTM na URL, salva (sobrescreve anteriores)
      const stored = getStoredUtmParams()
      const merged: UtmParams = {
        utm_source: urlUtmParams.utm_source || stored.utm_source,
        utm_medium: urlUtmParams.utm_medium || stored.utm_medium,
        utm_campaign: urlUtmParams.utm_campaign || stored.utm_campaign,
        utm_content: urlUtmParams.utm_content || stored.utm_content,
        utm_term: urlUtmParams.utm_term || stored.utm_term,
      }
      storeUtmParams(merged)
    }
  }, [hasUrlUtm, urlUtmParams])

  // Retorna UTMs combinados (URL tem prioridade sobre storage)
  const storedParams = getStoredUtmParams()

  return {
    utm_source: urlUtmParams.utm_source || storedParams.utm_source,
    utm_medium: urlUtmParams.utm_medium || storedParams.utm_medium,
    utm_campaign: urlUtmParams.utm_campaign || storedParams.utm_campaign,
    utm_content: urlUtmParams.utm_content || storedParams.utm_content,
    utm_term: urlUtmParams.utm_term || storedParams.utm_term,
  }
}

/**
 * Verifica se existe algum UTM param definido
 */
export function hasUtmParams(params: UtmParams): boolean {
  return UTM_KEYS.some((key) => params[key] !== null)
}

/**
 * Converte UTM params para objeto plano (remove nulls)
 * Útil para enviar em eventos de analytics
 */
export function utmParamsToObject(params: UtmParams): Record<string, string> {
  const result: Record<string, string> = {}

  for (const key of UTM_KEYS) {
    const value = params[key]
    if (value) {
      result[key] = value
    }
  }

  return result
}
