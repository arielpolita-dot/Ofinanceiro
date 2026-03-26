import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'

const STORAGE_PREFIX = import.meta.env.VITE_STORAGE_PREFIX || 'app'
const THEME_KEY = `${STORAGE_PREFIX}_theme`
const LANGUAGE_KEY = `${STORAGE_PREFIX}_language`

// Track handler calls via shared mutable refs
const handlers: {
  onToggle: ((e: unknown) => void) | null
  onSelect: ((e: unknown) => void) | null
} = { onToggle: null, onSelect: null }

vi.mock('../../../design-system', () => ({
  Page: ({ title, description, children }: { title?: string; description?: string; children: React.ReactNode }) =>
    <div data-testid="page"><h1>{title}</h1><p>{description}</p>{children}</div>,
  Card: ({ children }: { children: React.ReactNode }) =>
    <div data-testid="card">{children}</div>,
  CardHeader: ({ title, children }: { title?: string; description?: string; children?: React.ReactNode }) =>
    <div>{title || children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Select: function MockSelect(props: Record<string, unknown>) {
    handlers.onSelect = props.onChange as typeof handlers.onSelect
    return <div data-testid="language-select" data-value={props.value as string} />
  },
  Toggle: function MockToggle(props: Record<string, unknown>) {
    handlers.onToggle = props.onChange as typeof handlers.onToggle
    return <div data-testid="theme-toggle" data-checked={String(!!props.checked)} />
  },
}))

import { Settings } from '../pages/Settings'

describe('Settings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    handlers.onToggle = null
    handlers.onSelect = null
  })

  it('renders page title', () => {
    render(<Settings />)
    expect(screen.getByText('settings.title')).toBeInTheDocument()
  })

  it('renders theme and language sections', () => {
    render(<Settings />)
    expect(screen.getByText('settings.themeTitle')).toBeInTheDocument()
    expect(screen.getByText('settings.languageTitle')).toBeInTheDocument()
  })

  it('enables dark theme and saves to localStorage', () => {
    render(<Settings />)

    act(() => {
      handlers.onToggle!({ target: { checked: true } })
    })

    expect(localStorage.getItem(THEME_KEY)).toBe('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('loads saved dark theme from localStorage', () => {
    localStorage.setItem(THEME_KEY, 'dark')
    render(<Settings />)

    const toggle = screen.getByTestId('theme-toggle')
    expect(toggle.getAttribute('data-checked')).toBe('true')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('disables dark theme when switching to light', () => {
    localStorage.setItem(THEME_KEY, 'dark')
    document.documentElement.setAttribute('data-theme', 'dark')

    render(<Settings />)

    act(() => {
      handlers.onToggle!({ target: { checked: false } })
    })

    expect(localStorage.getItem(THEME_KEY)).toBe('light')
    expect(document.documentElement.getAttribute('data-theme')).toBeNull()
  })

  it('saves language preference to localStorage', () => {
    render(<Settings />)

    act(() => {
      handlers.onSelect!({ target: { value: 'en' } })
    })

    expect(localStorage.getItem(LANGUAGE_KEY)).toBe('en')
  })
})
