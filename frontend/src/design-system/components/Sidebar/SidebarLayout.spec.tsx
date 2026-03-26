import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Sidebar, SidebarOverlay, SidebarHeader, SidebarFooter } from './SidebarLayout'
import { SidebarProvider } from './SidebarContext'

const W = ({ children }: { children: React.ReactNode }) => <SidebarProvider>{children}</SidebarProvider>

describe('SidebarOverlay', () => {
  it('renders', () => { const { container } = render(<W><SidebarOverlay /></W>); expect(container).toBeDefined() })
})
describe('Sidebar', () => {
  it('renders children', () => { render(<W><Sidebar><div>Nav</div></Sidebar></W>); expect(screen.getByText('Nav')).toBeInTheDocument() })
})
describe('SidebarHeader', () => {
  it('renders children', () => { render(<W><SidebarHeader>Header</SidebarHeader></W>); expect(screen.getByText('Header')).toBeInTheDocument() })
})
describe('SidebarFooter', () => {
  it('renders children', () => { render(<W><SidebarFooter>Footer</SidebarFooter></W>); expect(screen.getByText('Footer')).toBeInTheDocument() })
})
