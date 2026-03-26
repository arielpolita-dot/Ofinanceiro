import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { FormGroup } from './FormGroup'

describe('FormGroup', () => {
  it('renders label and children', () => {
    render(<FormGroup label="Name"><input /></FormGroup>)
    expect(screen.getByText('Name')).toBeInTheDocument()
  })
  it('renders error', () => {
    render(<FormGroup label="X" error="Required"><input /></FormGroup>)
    expect(screen.getByText('Required')).toBeInTheDocument()
  })
  it('renders hint', () => {
    render(<FormGroup label="X" hint="Helper text"><input /></FormGroup>)
    expect(screen.getByText('Helper text')).toBeInTheDocument()
  })
})
