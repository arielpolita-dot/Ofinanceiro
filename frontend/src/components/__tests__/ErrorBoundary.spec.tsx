import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ErrorBoundary } from '../ErrorBoundary'

vi.mock('i18next', () => ({
  default: { t: (key: string) => key },
  t: (key: string) => key,
}))

const ThrowError = () => { throw new Error('Test error') }

describe('ErrorBoundary', () => {
  beforeEach(() => { vi.spyOn(console, 'error').mockImplementation(() => {}) })

  it('renders children when no error', () => {
    render(<ErrorBoundary><div>OK</div></ErrorBoundary>)
    expect(screen.getByText('OK')).toBeInTheDocument()
  })

  it('renders fallback on error', () => {
    render(<ErrorBoundary><ThrowError /></ErrorBoundary>)
    expect(screen.getByText('errorBoundary.title')).toBeInTheDocument()
    expect(screen.getByText('errorBoundary.reloadButton')).toBeInTheDocument()
  })

  it('renders custom fallback', () => {
    render(<ErrorBoundary fallback={<div>Custom error</div>}><ThrowError /></ErrorBoundary>)
    expect(screen.getByText('Custom error')).toBeInTheDocument()
  })
})
