import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { SidebarProvider, useSidebar } from './SidebarContext'
import { Sidebar, SidebarHeader, SidebarFooter } from './SidebarLayout'
import { SidebarNav, NavItem } from './SidebarNav'
import { UserProfile } from './SidebarUser'
import { MobileHeader } from './MobileHeader'

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <SidebarProvider>{children}</SidebarProvider>
)

describe('SidebarProvider', () => {
  it('provides context', () => {
    const Consumer = () => { const ctx = useSidebar(); return <div>{ctx.isOpen ? 'open' : 'closed'}</div> }
    render(<Wrapper><Consumer /></Wrapper>)
    expect(screen.getByText('closed')).toBeInTheDocument()
  })
})

describe('Sidebar', () => {
  it('renders children', () => {
    render(<Wrapper><Sidebar><div>Nav</div></Sidebar></Wrapper>)
    expect(screen.getByText('Nav')).toBeInTheDocument()
  })
})

describe('SidebarHeader', () => {
  it('renders children', () => {
    render(<Wrapper><SidebarHeader><span>Logo</span></SidebarHeader></Wrapper>)
    expect(screen.getByText('Logo')).toBeInTheDocument()
  })
})

describe('SidebarFooter', () => {
  it('renders children', () => {
    render(<Wrapper><SidebarFooter><span>Foot</span></SidebarFooter></Wrapper>)
    expect(screen.getByText('Foot')).toBeInTheDocument()
  })
})

describe('SidebarNav', () => {
  it('renders nav items', () => {
    render(<Wrapper><SidebarNav><NavItem href="/">Home</NavItem></SidebarNav></Wrapper>)
    expect(screen.getByText('Home')).toBeInTheDocument()
  })
})

describe('NavItem', () => {
  it('renders with active state', () => {
    render(<Wrapper><SidebarNav><NavItem href="/" active>Active</NavItem></SidebarNav></Wrapper>)
    expect(screen.getByText('Active').closest('a')).toHaveClass('active')
  })
})

describe('UserProfile', () => {
  it('renders name and email', () => {
    render(<Wrapper><UserProfile name="Diego" email="d@t.com" /></Wrapper>)
    expect(screen.getByText('Diego')).toBeInTheDocument()
    expect(screen.getByText('d@t.com')).toBeInTheDocument()
  })
})

describe('MobileHeader', () => {
  it('renders', () => {
    const { container } = render(<Wrapper><MobileHeader /></Wrapper>)
    expect(container.querySelector('.mobile-header')).toBeInTheDocument()
  })
})
