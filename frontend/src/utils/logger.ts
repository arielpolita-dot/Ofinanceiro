/**
 * Centralized Logger Utility
 *
 * - Development: colored console output with timestamps, prefixes, grouping
 * - Production: all output silenced
 *
 * Usage:
 *   logger.info('message')
 *   logger.auth('User logged in', { userId: '123' })
 *   logger.group('Auth Flow', () => { logger.auth('step 1'); logger.auth('step 2') })
 *   logger.table([{ name: 'Alice', role: 'admin' }])
 *   logger.separator('Section')
 */

const isDev = import.meta.env.DEV

type LogMethod = (...args: unknown[]) => void

const COLORS = {
  info: '#3b82f6',
  warn: '#eab308',
  error: '#ef4444',
  debug: '#6b7280',
  auth: '#22c55e',
  analytics: '#a855f7',
  api: '#06b6d4',
  billing: '#f97316',
  perf: '#ec4899',
} as const

const ICONS = {
  info: '\u2139\ufe0f',
  warn: '\u26a0\ufe0f',
  error: '\u274c',
  debug: '\ud83d\udd0d',
  auth: '\ud83d\udd12',
  analytics: '\ud83d\udcca',
  api: '\ud83c\udf10',
  billing: '\ud83d\udcb3',
  perf: '\u26a1',
} as const

type LogLevel = keyof typeof COLORS

function timestamp(): string {
  const now = new Date()
  return now.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  } as Intl.DateTimeFormatOptions & { fractionalSecondDigits: number })
}

function createMethod(level: LogLevel): LogMethod {
  if (!isDev) return () => {}

  const color = COLORS[level]
  const icon = ICONS[level]
  const label = level.toUpperCase()
  const consoleFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log

  return (...args: unknown[]) => {
    const ts = timestamp()
    const prefix = `${icon} [${label}]`
    const style = `color: ${color}; font-weight: bold`
    const tsStyle = 'color: #9ca3af; font-size: 10px'

    const [first, ...rest] = args
    if (typeof first === 'string') {
      consoleFn(`%c${ts} %c${prefix} ${first}`, tsStyle, style, ...rest)
    } else {
      consoleFn(`%c${ts} %c${prefix}`, tsStyle, style, ...args)
    }
  }
}

function noop(): void {}

/**
 * Groups related log messages under a collapsible section (dev only).
 */
function group(label: string, fn: () => void): void {
  if (!isDev) return
  const style = 'color: #8b5cf6; font-weight: bold; font-size: 12px'
  console.groupCollapsed(`%c\u25b6 ${label}`, style)
  try {
    fn()
  } finally {
    console.groupEnd()
  }
}

/**
 * Logs data in table format (dev only).
 */
function table(data: unknown[], columns?: string[]): void {
  if (!isDev) return
  if (columns) {
    console.table(data, columns)
  } else {
    console.table(data)
  }
}

/**
 * Prints a visual separator line (dev only).
 */
function separator(label?: string): void {
  if (!isDev) return
  const line = '\u2500'.repeat(40)
  if (label) {
    console.log(`%c${line} ${label} ${line}`, 'color: #6b7280')
  } else {
    console.log(`%c${line}${line}`, 'color: #6b7280')
  }
}

/**
 * Measures execution time of a function (dev only).
 */
function time<T>(label: string, fn: () => T): T {
  if (!isDev) return fn()
  const start = performance.now()
  const result = fn()
  const duration = (performance.now() - start).toFixed(2)
  console.log(
    `%c${timestamp()} %c\u26a1 [PERF] %c${label}: ${duration}ms`,
    'color: #9ca3af; font-size: 10px',
    'color: #ec4899; font-weight: bold',
    'color: #ec4899',
  )
  return result
}

/**
 * Measures execution time of an async function (dev only).
 */
async function timeAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
  if (!isDev) return fn()
  const start = performance.now()
  const result = await fn()
  const duration = (performance.now() - start).toFixed(2)
  console.log(
    `%c${timestamp()} %c\u26a1 [PERF] %c${label}: ${duration}ms`,
    'color: #9ca3af; font-size: 10px',
    'color: #ec4899; font-weight: bold',
    'color: #ec4899',
  )
  return result
}

export const logger = {
  // Log levels
  info: createMethod('info'),
  warn: createMethod('warn'),
  error: createMethod('error'),
  debug: createMethod('debug'),
  auth: createMethod('auth'),
  analytics: createMethod('analytics'),
  api: createMethod('api'),
  billing: createMethod('billing'),
  perf: createMethod('perf'),

  // Utilities
  group: isDev ? group : noop as typeof group,
  table: isDev ? table : noop as typeof table,
  separator: isDev ? separator : noop as typeof separator,
  time: isDev ? time : (<T>(_: string, fn: () => T) => fn()) as typeof time,
  timeAsync: isDev ? timeAsync : (<T>(_: string, fn: () => Promise<T>) => fn()) as typeof timeAsync,
}
