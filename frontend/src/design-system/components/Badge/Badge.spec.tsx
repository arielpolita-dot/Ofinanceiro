import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Badge } from './Badge'

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>Active</Badge>)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })
  it('renders with variant', () => {
    const { container } = render(<Badge variant="success">OK</Badge>)
    expect(container.firstChild).toHaveClass('badge-success')
  })
  it('renders dot', () => {
    const { container } = render(<Badge dot>Status</Badge>)
    expect(container.querySelector('.badge-dot-indicator')).toBeInTheDocument()
  })
})
