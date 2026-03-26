import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Avatar, AvatarGroup } from './Avatar'

describe('Avatar', () => {
  it('renders with image', () => {
    render(<Avatar src="/img.png" alt="User" />)
    expect(screen.getByAltText('User')).toBeInTheDocument()
  })
  it('renders initials when no src', () => {
    render(<Avatar name="Diego Cezimbra" />)
    expect(screen.getByText('DC')).toBeInTheDocument()
  })
  it('renders with size', () => {
    const { container } = render(<Avatar name="A B" size="lg" />)
    expect(container.firstChild).toHaveClass('avatar-lg')
  })
  it('renders status', () => {
    const { container } = render(<Avatar name="A" status="online" />)
    expect(container.querySelector('.avatar-status')).toBeInTheDocument()
  })
})

describe('AvatarGroup', () => {
  it('renders children', () => {
    render(<AvatarGroup><Avatar name="A" /><Avatar name="B" /></AvatarGroup>)
    expect(screen.getByText('A')).toBeInTheDocument()
  })
})
