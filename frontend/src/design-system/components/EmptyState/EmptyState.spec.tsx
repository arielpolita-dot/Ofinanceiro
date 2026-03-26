import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { EmptyState } from './EmptyState'

describe('EmptyState', () => {
  it('renders title', () => {
    render(<EmptyState title="No items" />)
    expect(screen.getByText('No items')).toBeInTheDocument()
  })
  it('renders description', () => {
    render(<EmptyState title="T" description="Details" />)
    expect(screen.getByText('Details')).toBeInTheDocument()
  })
  it('renders action', () => {
    render(<EmptyState title="T" action={<button>Add</button>} />)
    expect(screen.getByText('Add')).toBeInTheDocument()
  })
})
