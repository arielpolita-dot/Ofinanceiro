import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('logger', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'group').mockImplementation(() => {})
    vi.spyOn(console, 'groupEnd').mockImplementation(() => {})
    vi.spyOn(console, 'table').mockImplementation(() => {})
  })

  it('exports all methods', async () => {
    const { logger } = await import('../logger')
    expect(typeof logger.info).toBe('function')
    expect(typeof logger.warn).toBe('function')
    expect(typeof logger.error).toBe('function')
    expect(typeof logger.debug).toBe('function')
    expect(typeof logger.auth).toBe('function')
    expect(typeof logger.analytics).toBe('function')
    expect(typeof logger.group).toBe('function')
    expect(typeof logger.table).toBe('function')
    expect(typeof logger.separator).toBe('function')
    expect(typeof logger.time).toBe('function')
    expect(typeof logger.timeAsync).toBe('function')
  })

  it('calls info', async () => {
    const { logger } = await import('../logger')
    logger.info('test')
  })
  it('calls warn', async () => {
    const { logger } = await import('../logger')
    logger.warn('test')
  })
  it('calls error', async () => {
    const { logger } = await import('../logger')
    logger.error('test')
  })
  it('calls group', async () => {
    const { logger } = await import('../logger')
    logger.group('label', () => {})
  })
  it('calls table', async () => {
    const { logger } = await import('../logger')
    logger.table([{ a: 1 }])
  })
  it('calls separator', async () => {
    const { logger } = await import('../logger')
    logger.separator('---')
  })
  it('calls time', async () => {
    const { logger } = await import('../logger')
    const result = logger.time('test', () => 42)
    expect(result).toBe(42)
  })
  it('calls timeAsync', async () => {
    const { logger } = await import('../logger')
    const result = await logger.timeAsync('test', async () => 42)
    expect(result).toBe(42)
  })
})
