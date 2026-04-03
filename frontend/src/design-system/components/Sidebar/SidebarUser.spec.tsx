import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { UserProfile, LogoutButton, SidebarUserSection } from './SidebarUser'
import { SidebarProvider } from './SidebarContext'

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <SidebarProvider>{children}</SidebarProvider>
)

describe('UserProfile', () => {
  it('renders name and email', () => {
    render(<Wrapper><UserProfile name="Diego" email="d@t.com" /></Wrapper>)
    expect(screen.getByText('Diego')).toBeInTheDocument()
    expect(screen.getByText('d@t.com')).toBeInTheDocument()
  })
  it('renders avatar', () => {
    render(<Wrapper><UserProfile name="Diego" email="d@t.com" avatar="/img.png" /></Wrapper>)
  })
})

describe('LogoutButton', () => {
  it('renders and handles click', () => {
    const fn = vi.fn()
    render(<Wrapper><LogoutButton onLogout={fn} /></Wrapper>)
    fireEvent.click(screen.getByText('Sair'))
    expect(fn).toHaveBeenCalled()
  })
})

describe('SidebarUserSection', () => {
  it('renders children', () => {
    render(<Wrapper><SidebarUserSection name="Test"><span>User</span></SidebarUserSection></Wrapper>)
    expect(screen.getByText('User')).toBeInTheDocument()
  })
})
