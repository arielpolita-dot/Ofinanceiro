import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Pagination } from './Pagination'

describe('Pagination', () => {
  it('renders page numbers', () => {
    render(<Pagination currentPage={1} totalPages={5} onPageChange={() => {}} />)
    expect(screen.getByText('1')).toBeInTheDocument()
  })
  it('calls onPageChange', () => {
    const fn = vi.fn()
    render(<Pagination currentPage={1} totalPages={5} onPageChange={fn} />)
    fireEvent.click(screen.getByText('2'))
    expect(fn).toHaveBeenCalledWith(2)
  })
})
