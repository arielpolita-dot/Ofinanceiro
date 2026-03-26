import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Input } from './Input'

describe('Input', () => {
  it('renders with placeholder', () => {
    render(<Input placeholder="Type..." />)
    expect(screen.getByPlaceholderText('Type...')).toBeInTheDocument()
  })
  it('renders with error class', () => {
    const { container } = render(<Input error placeholder="X" />)
    expect(container.querySelector('.input-error')).toBeInTheDocument()
  })
  it('renders disabled', () => {
    render(<Input placeholder="X" disabled />)
    expect(screen.getByPlaceholderText('X')).toBeDisabled()
  })
})
