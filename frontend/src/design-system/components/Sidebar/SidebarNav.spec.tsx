import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { SidebarNav, NavItem } from './SidebarNav'
import { SidebarProvider } from './SidebarContext'

const W = ({ children }: { children: React.ReactNode }) => <SidebarProvider>{children}</SidebarProvider>

describe('SidebarNav', () => {
  it('renders children', () => { render(<W><SidebarNav><div>Item</div></SidebarNav></W>); expect(screen.getByText('Item')).toBeInTheDocument() })
})
describe('NavItem', () => {
  it('renders with href', () => { render(<W><SidebarNav><NavItem href="/test">Link</NavItem></SidebarNav></W>); expect(screen.getByText('Link')).toBeInTheDocument() })
  it('renders active', () => {
    render(<W><SidebarNav><NavItem href="/" active>Active</NavItem></SidebarNav></W>)
    const link = screen.getByText('Active').closest('a')
    expect(link?.className).toContain('active')
  })
  it('renders with icon', () => {
    render(<W><SidebarNav><NavItem href="/" icon={<span data-testid="icon">I</span>}>With Icon</NavItem></SidebarNav></W>)
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })
})
