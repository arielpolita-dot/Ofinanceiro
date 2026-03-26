import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { StatCard } from './StatCard'

describe('StatCard', () => {
  it('renders title and value', () => {
    render(<StatCard title="Users" value="100" />)
    expect(screen.getByText('Users')).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()
  })
  it('renders with trend', () => {
    render(<StatCard title="Revenue" value="5000" trend="up" change={{ value: 5, label: '+5%' }} />)
    expect(screen.getByText('Revenue')).toBeInTheDocument()
  })
})
