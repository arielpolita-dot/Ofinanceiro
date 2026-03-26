import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Text } from './Text'

describe('Text', () => {
  it('renders children', () => {
    render(<Text>Hello</Text>)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
