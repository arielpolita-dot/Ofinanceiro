import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Button } from './Button'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click</Button>)
    expect(screen.getByText('Click')).toBeInTheDocument()
  })
  it('renders with variant', () => {
    const { container } = render(<Button variant="danger">Del</Button>)
    expect(container.querySelector('.btn-danger')).toBeInTheDocument()
  })
  it('renders loading state', () => {
    const { container } = render(<Button loading>Save</Button>)
    expect(container.querySelector('.btn-loading')).toBeInTheDocument()
  })
  it('renders disabled', () => {
    render(<Button disabled>No</Button>)
    expect(screen.getByRole('button', { name: 'No' })).toBeDisabled()
  })
  it('handles click', () => {
    const fn = vi.fn()
    render(<Button onClick={fn}>Go</Button>)
    fireEvent.click(screen.getByText('Go'))
    expect(fn).toHaveBeenCalled()
  })
  it('renders fullWidth', () => {
    const { container } = render(<Button fullWidth>Wide</Button>)
    expect(container.querySelector('.btn-full')).toBeInTheDocument()
  })
  it('renders with left icon', () => {
    render(<Button leftIcon={<span data-testid="icon">+</span>}>Add</Button>)
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })
  it('renders sizes', () => {
    const { container } = render(<Button size="sm">Sm</Button>)
    expect(container.querySelector('.btn-sm')).toBeInTheDocument()
  })
})
