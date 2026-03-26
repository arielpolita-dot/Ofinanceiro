import { render, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Toggle } from './Toggle'

describe('Toggle', () => {
  it('renders', () => {
    const { container } = render(<Toggle checked={false} onChange={() => {}} />)
    expect(container.querySelector('.toggle')).toBeInTheDocument()
  })
  it('calls onChange', () => {
    const fn = vi.fn()
    const { container } = render(<Toggle checked={false} onChange={fn} />)
    fireEvent.click(container.querySelector('.toggle')!)
    expect(fn).toHaveBeenCalled()
  })
})
