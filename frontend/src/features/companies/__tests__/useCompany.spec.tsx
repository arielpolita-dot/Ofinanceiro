import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import { CompanyProvider, useCompany } from '../hooks/useCompany'
import type { Company } from '../services/company.types'

const { mockGetAll, mockSwitchCompany, mockCreate, mockUseAuth } = vi.hoisted(() => ({
  mockGetAll: vi.fn(),
  mockSwitchCompany: vi.fn(),
  mockCreate: vi.fn(),
  mockUseAuth: vi.fn(),
}))

vi.mock('../services/company.service', () => ({
  companyService: {
    getAll: mockGetAll,
    switchCompany: mockSwitchCompany,
    create: mockCreate,
  },
}))

vi.mock('../../auth/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}))

// STORAGE_PREFIX comes from import.meta.env, which may be overridden by .env
const STORAGE_PREFIX = import.meta.env.VITE_STORAGE_PREFIX || 'app'
const STORAGE_KEY = `${STORAGE_PREFIX}_active_company_id`

function TestConsumer() {
  const ctx = useCompany()
  return (
    <div>
      <span data-testid="loading">{String(ctx.isLoading)}</span>
      <span data-testid="active">{ctx.activeCompany?.name ?? 'none'}</span>
      <span data-testid="count">{ctx.companies.length}</span>
      <button data-testid="switch" onClick={() => ctx.switchCompany('c2')}>Switch</button>
      <button data-testid="create" onClick={() => ctx.createCompany({ name: 'New' })}>Create</button>
      <button data-testid="refresh" onClick={() => ctx.refresh()}>Refresh</button>
    </div>
  )
}

function renderWithProvider() {
  return render(
    <CompanyProvider>
      <TestConsumer />
    </CompanyProvider>,
  )
}

const fakeCompanies: Company[] = [
  { id: 'c1', name: 'Acme', slug: 'acme', role: 'owner' },
  { id: 'c2', name: 'Beta', slug: 'beta', role: 'member' },
]

describe('useCompany', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockUseAuth.mockReturnValue({
      user: { id: 'u1', email: 'test@test.com', name: 'Test', projectId: 'c1' },
      isAuthenticated: true,
    })
    mockGetAll.mockResolvedValue(fakeCompanies)
  })

  it('throws when used outside provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<TestConsumer />)).toThrow(
      'useCompany must be used within CompanyProvider',
    )
    spy.mockRestore()
  })

  it('fetches companies on mount and sets active from projectId', async () => {
    renderWithProvider()

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false')
    })

    expect(mockGetAll).toHaveBeenCalledOnce()
    expect(screen.getByTestId('active').textContent).toBe('Acme')
    expect(screen.getByTestId('count').textContent).toBe('2')
  })

  it('stores active company id in localStorage after load', async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')

    renderWithProvider()

    await waitFor(() => {
      expect(screen.getByTestId('active').textContent).toBe('Acme')
    })

    // Verify localStorage.setItem was called with the active company id
    await waitFor(() => {
      expect(setItemSpy).toHaveBeenCalledWith(STORAGE_KEY, 'c1')
    })

    setItemSpy.mockRestore()
  })

  it('falls back to first company when projectId not in companies', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'u1', email: 'test@test.com', name: 'Test', projectId: 'unknown' },
      isAuthenticated: true,
    })

    renderWithProvider()

    // When projectId doesn't match, and nothing in localStorage, uses first company
    await waitFor(() => {
      expect(screen.getByTestId('active').textContent).toBe('Acme')
    })
  })

  it('uses localStorage fallback when projectId not found', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'u1', email: 'test@test.com', name: 'Test', projectId: 'unknown' },
      isAuthenticated: true,
    })

    // Spy on getItem to verify it's called and simulate stored value
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem')
      .mockImplementation((key: string) => {
        if (key === STORAGE_KEY) return 'c2'
        return null
      })

    renderWithProvider()

    await waitFor(() => {
      expect(screen.getByTestId('active').textContent).toBe('Beta')
    })

    getItemSpy.mockRestore()
  })

  it('defaults to first company when no projectId', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'u1', email: 'test@test.com', name: 'Test' },
      isAuthenticated: true,
    })

    renderWithProvider()

    await waitFor(() => {
      expect(screen.getByTestId('active').textContent).toBe('Acme')
    })
  })

  it('switchCompany calls service', async () => {
    mockSwitchCompany.mockResolvedValue({ token: 'new-token' })

    renderWithProvider()

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false')
    })

    await act(async () => {
      screen.getByTestId('switch').click()
    })

    expect(mockSwitchCompany).toHaveBeenCalledWith('c2')
  })

  it('createCompany calls service and refreshes list', async () => {
    const newCompany = { id: 'c3', name: 'New', slug: 'new', role: 'owner' }
    mockCreate.mockResolvedValue(newCompany)
    mockGetAll
      .mockResolvedValueOnce(fakeCompanies)
      .mockResolvedValueOnce([...fakeCompanies, newCompany])

    renderWithProvider()

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false')
    })

    await act(async () => {
      screen.getByTestId('create').click()
    })

    expect(mockCreate).toHaveBeenCalledWith({ name: 'New' })
  })

  it('refresh re-fetches companies', async () => {
    renderWithProvider()

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false')
    })

    expect(mockGetAll).toHaveBeenCalledTimes(1)

    await act(async () => {
      screen.getByTestId('refresh').click()
    })

    expect(mockGetAll).toHaveBeenCalledTimes(2)
  })

  it('does not fetch when user is not authenticated', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
    })

    renderWithProvider()

    expect(mockGetAll).not.toHaveBeenCalled()
    expect(screen.getByTestId('active').textContent).toBe('none')
  })
})
