import { describe, it, expect, beforeEach } from 'vitest'
import { getStoredUtmParams, hasUtmParams, utmParamsToObject, type UtmParams } from '../useUtmParams'

describe('getStoredUtmParams', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('returns all nulls when nothing stored', () => {
    const result = getStoredUtmParams()
    expect(result).toEqual({
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_content: null,
      utm_term: null,
    })
  })

  it('returns stored params from sessionStorage', () => {
    const stored: UtmParams = {
      utm_source: 'meta',
      utm_medium: 'cpc',
      utm_campaign: 'black_friday',
      utm_content: null,
      utm_term: null,
    }
    sessionStorage.setItem('app_utm_params', JSON.stringify(stored))

    const result = getStoredUtmParams()
    expect(result).toEqual(stored)
  })

  it('returns nulls when sessionStorage has invalid JSON', () => {
    sessionStorage.setItem('app_utm_params', 'not json')

    const result = getStoredUtmParams()
    expect(result.utm_source).toBeNull()
  })
})

describe('hasUtmParams', () => {
  it('returns false when all are null', () => {
    const params: UtmParams = {
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_content: null,
      utm_term: null,
    }
    expect(hasUtmParams(params)).toBe(false)
  })

  it('returns true when any param is set', () => {
    const params: UtmParams = {
      utm_source: 'google',
      utm_medium: null,
      utm_campaign: null,
      utm_content: null,
      utm_term: null,
    }
    expect(hasUtmParams(params)).toBe(true)
  })

  it('returns true when all params are set', () => {
    const params: UtmParams = {
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: 'summer',
      utm_content: 'banner',
      utm_term: 'shoes',
    }
    expect(hasUtmParams(params)).toBe(true)
  })
})

describe('utmParamsToObject', () => {
  it('returns empty object when all null', () => {
    const params: UtmParams = {
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_content: null,
      utm_term: null,
    }
    expect(utmParamsToObject(params)).toEqual({})
  })

  it('includes only non-null values', () => {
    const params: UtmParams = {
      utm_source: 'meta',
      utm_medium: null,
      utm_campaign: 'video_v5',
      utm_content: null,
      utm_term: null,
    }
    expect(utmParamsToObject(params)).toEqual({
      utm_source: 'meta',
      utm_campaign: 'video_v5',
    })
  })

  it('includes all values when all set', () => {
    const params: UtmParams = {
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: 'summer',
      utm_content: 'banner',
      utm_term: 'shoes',
    }
    const result = utmParamsToObject(params)
    expect(Object.keys(result)).toHaveLength(5)
    expect(result.utm_source).toBe('google')
  })
})
