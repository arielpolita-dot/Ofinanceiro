import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import App from './App'

vi.mock('./services/analytics', () => ({
  initAnalytics: vi.fn(),
  trackPageView: vi.fn(),
}))

vi.mock('./features/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'test@test.com', name: 'Test User', avatar: null },
    isLoading: false,
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('./features/companies/hooks/useCompany', () => ({
  CompanyProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useCompany: () => ({
    companies: [],
    activeCompany: null,
    isLoading: false,
    switchCompany: vi.fn(),
    createCompany: vi.fn(),
    refresh: vi.fn(),
  }),
}))

vi.mock('./components/Layout', () => ({
  Layout: () => <div data-testid="layout">Layout</div>,
}))

vi.mock('./features/plans/pages/Plans', () => ({
  default: { Plans: () => <div data-testid="plans-page">Plans</div> },
  Plans: () => <div data-testid="plans-page">Plans</div>,
}))

vi.mock('./features/auth/pages/AuthCallback', () => ({
  default: { AuthCallback: () => <div data-testid="auth-callback">AuthCallback</div> },
  AuthCallback: () => <div data-testid="auth-callback">AuthCallback</div>,
}))

vi.mock('./features/companies/pages/Companies', () => ({
  default: { Companies: () => <div data-testid="companies-page">Companies</div> },
  Companies: () => <div data-testid="companies-page">Companies</div>,
}))

vi.mock('./features/companies/pages/CompanyMembers', () => ({
  default: { CompanyMembers: () => <div data-testid="company-members-page">CompanyMembers</div> },
  CompanyMembers: () => <div data-testid="company-members-page">CompanyMembers</div>,
}))

vi.mock('./features/settings/pages/Settings', () => ({
  default: { Settings: () => <div data-testid="settings-page">Settings</div> },
  Settings: () => <div data-testid="settings-page">Settings</div>,
}))

vi.mock('./components/PageTracker', () => ({
  PageTracker: () => null,
}))

vi.mock('./styles/global.css', () => ({}))

afterEach(() => {
  window.history.pushState({}, '', '/')
})

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />)
    expect(document.body).toBeTruthy()
  })

  it('renders layout on root route', async () => {
    render(<App />)
    await waitFor(() => {
      expect(screen.getByTestId('layout')).toBeInTheDocument()
    })
  })

  it('renders auth callback on /auth/callback', async () => {
    window.history.pushState({}, '', '/auth/callback')
    render(<App />)
    await waitFor(() => {
      expect(screen.getByTestId('auth-callback')).toBeInTheDocument()
    })
  })
})
