import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { InviteAccept } from '../pages/InviteAccept'

const { mockCompanyService, mockNavigate } = vi.hoisted(() => ({
  mockCompanyService: {
    getInviteInfo: vi.fn(),
    acceptInvite: vi.fn(),
  },
  mockNavigate: vi.fn(),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ token: 'test-token-123' }),
  }
})

vi.mock('../../companies/services/company.service', () => ({
  companyService: mockCompanyService,
}))

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'u1', email: 'a@b.com' },
    isLoading: false,
    isAuthenticated: true,
  }),
}))

vi.mock('../../../design-system', () => ({
  Spinner: () => <div data-testid="spinner" />,
  Button: ({ children, onClick, loading, disabled }: {
    children: React.ReactNode; onClick?: () => void;
    loading?: boolean; disabled?: boolean
  }) => <button onClick={onClick} disabled={disabled || loading}>{children}</button>,
  Card: ({ children }: { children: React.ReactNode }) =>
    <div data-testid="card">{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

const inviteInfo = {
  companyName: 'Acme Corp',
  inviterName: 'John Doe',
  email: 'a@b.com',
  status: 'pending' as const,
  expiresAt: '2030-01-01T00:00:00.000Z',
}

describe('InviteAccept', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCompanyService.getInviteInfo.mockResolvedValue(inviteInfo)
    mockCompanyService.acceptInvite.mockResolvedValue({
      status: 'accepted', companyId: 'c1', role: 'member',
    })
  })

  it('shows spinner while loading', () => {
    mockCompanyService.getInviteInfo.mockReturnValue(new Promise(() => {}))

    render(<MemoryRouter><InviteAccept /></MemoryRouter>)
    expect(screen.getByTestId('spinner')).toBeInTheDocument()
  })

  it('shows invite info after loading', async () => {
    render(<MemoryRouter><InviteAccept /></MemoryRouter>)

    await waitFor(() => {
      expect(screen.getByText('invite.acceptButton')).toBeInTheDocument()
    })

    // Company name appears in the title
    expect(screen.getByText(/invite.title/)).toBeInTheDocument()
  })

  it('shows accept button for pending invite', async () => {
    render(<MemoryRouter><InviteAccept /></MemoryRouter>)

    await waitFor(() => {
      expect(screen.getByText('invite.acceptButton')).toBeInTheDocument()
    })
  })

  it('accepts invite on button click', async () => {
    render(<MemoryRouter><InviteAccept /></MemoryRouter>)

    await waitFor(() => {
      expect(screen.getByText('invite.acceptButton')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('invite.acceptButton'))

    await waitFor(() => {
      expect(mockCompanyService.acceptInvite).toHaveBeenCalledWith('test-token-123')
      expect(screen.getByText(/invite.acceptedTitle/)).toBeInTheDocument()
    })
  })

  it('shows error for invalid token', async () => {
    mockCompanyService.getInviteInfo.mockRejectedValue(new Error('Not found'))

    render(<MemoryRouter><InviteAccept /></MemoryRouter>)

    await waitFor(() => {
      expect(screen.getByText(/invite.notFound/)).toBeInTheDocument()
    })
  })

  it('shows expired message for expired invite', async () => {
    mockCompanyService.getInviteInfo.mockResolvedValue({
      ...inviteInfo,
      status: 'expired',
    })

    render(<MemoryRouter><InviteAccept /></MemoryRouter>)

    await waitFor(() => {
      expect(screen.getByText(/invite.expired/)).toBeInTheDocument()
    })
  })

  it('navigates to companies after acceptance', async () => {
    render(<MemoryRouter><InviteAccept /></MemoryRouter>)

    await waitFor(() => {
      expect(screen.getByText('invite.acceptButton')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('invite.acceptButton'))

    await waitFor(() => {
      expect(screen.getByText('invite.goToCompanies')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('invite.goToCompanies'))
    expect(mockNavigate).toHaveBeenCalledWith('/companies')
  })
})
