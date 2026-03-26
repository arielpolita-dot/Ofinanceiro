import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Card, CardHeader, CardContent, CardFooter } from './Card'

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Content</Card>)
    expect(screen.getByText('Content')).toBeInTheDocument()
  })
  it('renders with variant', () => {
    const { container } = render(<Card variant="bordered">X</Card>)
    expect(container.firstChild).toHaveClass('card-bordered')
  })
})
describe('CardHeader', () => {
  it('renders title', () => {
    render(<CardHeader title="Title" />)
    expect(screen.getByText('Title')).toBeInTheDocument()
  })
  it('renders description', () => {
    render(<CardHeader title="T" description="Desc" />)
    expect(screen.getByText('Desc')).toBeInTheDocument()
  })
})
describe('CardContent', () => {
  it('renders children', () => {
    render(<CardContent>Body</CardContent>)
    expect(screen.getByText('Body')).toBeInTheDocument()
  })
})
describe('CardFooter', () => {
  it('renders children', () => {
    render(<CardFooter>Footer</CardFooter>)
    expect(screen.getByText('Footer')).toBeInTheDocument()
  })
})
