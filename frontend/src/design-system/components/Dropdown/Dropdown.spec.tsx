import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Dropdown, DropdownItem, DropdownDivider, DropdownLabel } from './Dropdown'

describe('Dropdown', () => {
  it('renders trigger', () => {
    render(<Dropdown trigger={<button>Open</button>}><DropdownItem>Item</DropdownItem></Dropdown>)
    expect(screen.getByText('Open')).toBeInTheDocument()
  })
  it('shows items on click', () => {
    render(<Dropdown trigger={<button>Open</button>}><DropdownItem>Item 1</DropdownItem></Dropdown>)
    fireEvent.click(screen.getByText('Open'))
    expect(screen.getByText('Item 1')).toBeInTheDocument()
  })
})
describe('DropdownItem', () => {
  it('calls onClick', () => {
    const fn = vi.fn()
    render(<Dropdown trigger={<button>O</button>}><DropdownItem onClick={fn}>Click</DropdownItem></Dropdown>)
    fireEvent.click(screen.getByText('O'))
    fireEvent.click(screen.getByText('Click'))
    expect(fn).toHaveBeenCalled()
  })
})
describe('DropdownDivider', () => {
  it('renders', () => {
    const { container } = render(<DropdownDivider />)
    expect(container.firstChild).toHaveClass('dropdown-divider')
  })
})
describe('DropdownLabel', () => {
  it('renders text', () => {
    render(<DropdownLabel>Section</DropdownLabel>)
    expect(screen.getByText('Section')).toBeInTheDocument()
  })
})
