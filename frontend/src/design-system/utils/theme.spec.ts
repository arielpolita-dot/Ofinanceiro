import { describe, it, expect } from 'vitest'
import { lightTheme, darkTheme, createTheme, applyTheme, getThemeCssVariables } from './theme'

describe('lightTheme', () => {
  it('has colors', () => { expect(lightTheme.colors).toBeDefined() })
})
describe('darkTheme', () => {
  it('has colors', () => { expect(darkTheme.colors).toBeDefined() })
})
describe('createTheme', () => {
  it('creates default theme', () => {
    const theme = createTheme()
    expect(theme.colors).toBeDefined()
  })
  it('creates with overrides', () => {
    const theme = createTheme({ isDark: true })
    expect(theme).toBeDefined()
  })
})
describe('applyTheme', () => {
  it('applies theme to root', () => {
    applyTheme(lightTheme)
  })
})
describe('getThemeCssVariables', () => {
  it('returns CSS string', () => {
    const css = getThemeCssVariables(lightTheme)
    expect(typeof css).toBe('string')
  })
})
