/**
 * ==============================================================================
 * Format Utils - Utilitários de Formatação
 * ==============================================================================
 *
 * Funções utilitárias para formatação de dados no frontend.
 *
 * @module utils/format
 */

/**
 * Formata duração em milissegundos para string legível.
 *
 * @param ms - Duração em milissegundos
 * @returns String formatada (ex: "2.3s", "1m 15s", "1h 23min")
 *
 * @example
 * formatDuration(2300)     // "2.3s"
 * formatDuration(75000)    // "1m 15s"
 * formatDuration(4980000)  // "1h 23min"
 */
export function formatDuration(ms: number): string {
  if (ms < 0) return '0s'

  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  // Menos de 1 minuto - mostra segundos com decimal
  if (minutes === 0) {
    const secs = ms / 1000
    return secs < 10 ? `${secs.toFixed(1)}s` : `${Math.floor(secs)}s`
  }

  // Menos de 1 hora - mostra minutos e segundos
  if (hours === 0) {
    const remainingSecs = seconds % 60
    return remainingSecs > 0 ? `${minutes}m ${remainingSecs}s` : `${minutes}min`
  }

  // 1 hora ou mais - mostra horas e minutos
  const remainingMins = minutes % 60
  return remainingMins > 0 ? `${hours}h ${remainingMins}min` : `${hours}h`
}

/**
 * Calcula a duração entre duas datas ISO string.
 *
 * @param startedAt - Data de início (ISO string)
 * @param completedAt - Data de fim (ISO string)
 * @returns Duração em milissegundos ou null se inválido
 *
 * @example
 * calculateDuration('2024-01-01T10:00:00Z', '2024-01-01T10:05:30Z')
 * // Returns 330000 (5 minutos e 30 segundos)
 */
export function calculateDuration(startedAt?: string, completedAt?: string): number | null {
  if (!startedAt || !completedAt) return null

  const start = new Date(startedAt).getTime()
  const end = new Date(completedAt).getTime()

  if (isNaN(start) || isNaN(end)) return null

  return end - start
}

/**
 * Formata duração entre duas datas para exibição.
 * Combina calculateDuration + formatDuration.
 *
 * @param startedAt - Data de início (ISO string)
 * @param completedAt - Data de fim (ISO string)
 * @returns String formatada ou null se inválido
 *
 * @example
 * formatDurationFromDates('2024-01-01T10:00:00Z', '2024-01-01T10:05:30Z')
 * // Returns "5m 30s"
 */
export function formatDurationFromDates(startedAt?: string, completedAt?: string): string | null {
  const duration = calculateDuration(startedAt, completedAt)
  if (duration === null) return null
  return formatDuration(duration)
}
