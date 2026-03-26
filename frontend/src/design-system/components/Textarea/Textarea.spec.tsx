import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Textarea } from './Textarea'

describe('Textarea', () => {
  it('renders', () => {
    render(<Textarea placeholder="Type here" />)
    expect(screen.getByPlaceholderText('Type here')).toBeInTheDocument()
  })
})
