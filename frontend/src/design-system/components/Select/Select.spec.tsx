import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Select } from './Select'

describe('Select', () => {
  const options = [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }]
  it('renders options', () => {
    render(<Select options={options} />)
    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
  })
  it('renders placeholder', () => {
    render(<Select options={options} placeholder="Pick" />)
    expect(screen.getByText('Pick')).toBeInTheDocument()
  })
})
