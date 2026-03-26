import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Layout } from '../Layout'

const mockUseAuth = vi.fn()

vi.mock('../../features/auth/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}))

vi.mock('../../features/companies/components/CompanySwitcher', () => ({
  CompanySwitcher: () => <div data-testid="company-switcher">CompanySwitcher</div>,
}))

vi.mock('../../design-system', () => ({
  Sidebar: ({ children }: { children: React.ReactNode }) => <nav data-testid="sidebar">{children}</nav>,
  SidebarHeader: ({ title }: { title: string; logo: React.ReactNode }) => <div>{title}</div>,
  SidebarNav: ({ children }: { children: React.ReactNode }) => <ul>{children}</ul>,
  NavItem: ({ children, to }: { children: React.ReactNode; to?: string; icon?: React.ReactNode; as?: unknown; end?: boolean }) => (
    <li><a href={to}>{children}</a></li>
  ),
  SidebarFooter: ({ onLogout }: { onLogout: () => void }) => (
    <button onClick={onLogout} data-testid="logout-btn">Logout</button>
  ),
  SidebarUserSection: ({ name, email }: { name: string; email: string; avatar?: string }) => (
    <div data-testid="user-section">
      <span>{name}</span>
      <span>{email}</span>
    </div>
  ),
  SidebarProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarOverlay: () => null,
  MobileHeader: ({ title }: { title: string; logo: React.ReactNode }) => (
    <div data-testid="mobile-header">{title}</div>
  ),
  Layout: ({ children }: { children: React.ReactNode }) => <div data-testid="ds-layout">{children}</div>,
  MainContent: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
  Spinner: (_props: { size?: string }) => <div data-testid="spinner" />,
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    NavLink: ({ children, to, ...props }: { children: React.ReactNode; to: string; end?: boolean }) => (
      <a href={to} {...props}>{children}</a>
    ),
  }
})

describe('Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows spinner while loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: true,
      logout: vi.fn(),
    })

    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>,
    )
    expect(screen.getByTestId('spinner')).toBeInTheDocument()
  })

  it('shows redirecting message when no user', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      logout: vi.fn(),
    })

    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>,
    )
    expect(screen.getByText('common.redirectingToLogin')).toBeInTheDocument()
  })

  it('renders sidebar with navigation when authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@test.com', name: 'Test User', avatar: null },
      isLoading: false,
      logout: vi.fn(),
    })

    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>,
    )

    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
    expect(screen.getByText('sidebar.companies')).toBeInTheDocument()
    expect(screen.getByText('sidebar.plans')).toBeInTheDocument()
    expect(screen.getByText('sidebar.settings')).toBeInTheDocument()
    expect(screen.getByTestId('company-switcher')).toBeInTheDocument()
  })

  it('renders user info in sidebar', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'john@test.com', name: 'John Doe', avatar: null },
      isLoading: false,
      logout: vi.fn(),
    })

    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>,
    )

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('john@test.com')).toBeInTheDocument()
  })

  it('renders fallback name "User" when name is null', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@test.com', name: null, avatar: null },
      isLoading: false,
      logout: vi.fn(),
    })

    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>,
    )

    expect(screen.getByText('User')).toBeInTheDocument()
  })

  it('renders app title', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@test.com', name: 'Test', avatar: null },
      isLoading: false,
      logout: vi.fn(),
    })

    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>,
    )

    expect(screen.getAllByText('App Template').length).toBeGreaterThanOrEqual(1)
  })

  it('renders mobile header', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@test.com', name: 'Test', avatar: null },
      isLoading: false,
      logout: vi.fn(),
    })

    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>,
    )

    expect(screen.getByTestId('mobile-header')).toBeInTheDocument()
  })
})
