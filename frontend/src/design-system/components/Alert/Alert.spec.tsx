import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Alert } from './Alert'

describe('Alert', () => {
  it('renders children', () => {
    render(<Alert>Test message</Alert>)
    expect(screen.getByText('Test message')).toBeInTheDocument()
  })
  it('renders with variant', () => {
    const { container } = render(<Alert variant="danger">Error</Alert>)
    expect(container.firstChild).toHaveClass('alert-danger')
  })
})
