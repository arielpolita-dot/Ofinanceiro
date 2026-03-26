import { describe, it, expect } from 'vitest'
import { formatDuration, calculateDuration, formatDurationFromDates } from './format'

describe('formatDuration', () => {
  it('returns "0s" for negative values', () => {
    expect(formatDuration(-1)).toBe('0s')
    expect(formatDuration(-1000)).toBe('0s')
  })

  it('returns "0.0s" for zero', () => {
    expect(formatDuration(0)).toBe('0.0s')
  })

  it('formats sub-10s with one decimal', () => {
    expect(formatDuration(2300)).toBe('2.3s')
    expect(formatDuration(500)).toBe('0.5s')
    expect(formatDuration(9999)).toBe('10.0s')
  })

  it('formats 10s+ without decimal', () => {
    expect(formatDuration(15000)).toBe('15s')
    expect(formatDuration(59999)).toBe('59s')
  })

  it('formats minutes and seconds', () => {
    expect(formatDuration(60000)).toBe('1min')
    expect(formatDuration(75000)).toBe('1m 15s')
    expect(formatDuration(120000)).toBe('2min')
    expect(formatDuration(150000)).toBe('2m 30s')
  })

  it('formats hours and minutes', () => {
    expect(formatDuration(3600000)).toBe('1h')
    expect(formatDuration(4980000)).toBe('1h 23min')
    expect(formatDuration(7200000)).toBe('2h')
  })
})

describe('calculateDuration', () => {
  it('returns null when startedAt is missing', () => {
    expect(calculateDuration(undefined, '2024-01-01T10:05:00Z')).toBeNull()
  })

  it('returns null when completedAt is missing', () => {
    expect(calculateDuration('2024-01-01T10:00:00Z', undefined)).toBeNull()
  })

  it('returns null for invalid dates', () => {
    expect(calculateDuration('not-a-date', '2024-01-01T10:00:00Z')).toBeNull()
    expect(calculateDuration('2024-01-01T10:00:00Z', 'invalid')).toBeNull()
  })

  it('calculates duration in milliseconds', () => {
    const result = calculateDuration(
      '2024-01-01T10:00:00Z',
      '2024-01-01T10:05:30Z',
    )
    expect(result).toBe(330000)
  })

  it('returns negative for reversed dates', () => {
    const result = calculateDuration(
      '2024-01-01T10:05:00Z',
      '2024-01-01T10:00:00Z',
    )
    expect(result).toBe(-300000)
  })
})

describe('formatDurationFromDates', () => {
  it('returns null when dates are missing', () => {
    expect(formatDurationFromDates()).toBeNull()
    expect(formatDurationFromDates('2024-01-01T10:00:00Z')).toBeNull()
  })

  it('formats duration between two dates', () => {
    const result = formatDurationFromDates(
      '2024-01-01T10:00:00Z',
      '2024-01-01T10:05:30Z',
    )
    expect(result).toBe('5m 30s')
  })

  it('returns "0s" for negative durations', () => {
    const result = formatDurationFromDates(
      '2024-01-01T10:05:00Z',
      '2024-01-01T10:00:00Z',
    )
    expect(result).toBe('0s')
  })
})
