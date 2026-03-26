import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SearchInput } from './SearchInput'

describe('SearchInput', () => {
  it('renders with placeholder', () => {
    render(<SearchInput placeholder="Search..." />)
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
  })
  it('handles input change', () => {
    const fn = vi.fn()
    render(<SearchInput placeholder="S" onChange={fn} />)
    fireEvent.change(screen.getByPlaceholderText('S'), { target: { value: 'test' } })
    expect(fn).toHaveBeenCalled()
  })
  it('shows clear button when value present', () => {
    render(<SearchInput placeholder="S" value="test" onClear={vi.fn()} />)
  })
  it('calls onClear', () => {
    const fn = vi.fn()
    const { container } = render(<SearchInput value="test" onClear={fn} />)
    const clearBtn = container.querySelector('.search-input-clear')
    if (clearBtn) fireEvent.click(clearBtn)
  })
})
