import { describe, it, expect } from 'vitest'
import { hexToRgb, rgbToHex, darkenColor, lightenColor, addAlpha, getContrastColor, generateColorShades } from './colors'

describe('hexToRgb', () => {
  it('converts hex to rgb', () => { expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 }) })
  it('converts black', () => { expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 }) })
  it('returns null for invalid', () => { expect(hexToRgb('invalid')).toBeNull() })
})
describe('rgbToHex', () => {
  it('converts rgb to hex', () => { expect(rgbToHex(255, 0, 0)).toBe('#ff0000') })
})
describe('darkenColor', () => {
  it('darkens a color', () => {
    const result = darkenColor('#ffffff', 50)
    expect(result).toBeDefined()
  })
})
describe('lightenColor', () => {
  it('lightens a color', () => {
    const result = lightenColor('#000000', 50)
    expect(result).toBeDefined()
  })
})
describe('addAlpha', () => {
  it('adds alpha to hex', () => {
    const result = addAlpha('#ff0000', 0.5)
    expect(result).toContain('rgba')
  })
})
describe('getContrastColor', () => {
  it('returns dark for light bg', () => { expect(getContrastColor('#ffffff')).toBe('#000000') })
  it('returns light for dark bg', () => { expect(getContrastColor('#000000')).toBe('#ffffff') })
})
describe('generateColorShades', () => {
  it('generates shades', () => {
    const shades = generateColorShades('#3b82f6')
    expect(shades).toBeDefined()
  })
})
