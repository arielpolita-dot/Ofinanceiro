import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CompanyMembers } from '../pages/CompanyMembers'

const { mockCompanyService, mockNavigate } = vi.hoisted(() => ({
  mockCompanyService: {
    getById: vi.fn(),
    getMembers: vi.fn(),
    inviteMember: vi.fn(),
    updateMemberRole: vi.fn(),
    removeMember: vi.fn(),
    getInvites: vi.fn(),
    cancelInvite: vi.fn(),
    update: vi.fn(),
  },
  mockNavigate: vi.fn(),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: 'c1' }),
  }
})

vi.mock('../services/company.service', () => ({
  companyService: mockCompanyService,
}))

vi.mock('../../auth/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'u1', email: 'owner@test.com', name: 'Owner' },
    isLoading: false,
    isAuthenticated: true,
  }),
}))

vi.mock('../../../design-system', () => ({
  Page: ({ title, description, actions, children }: {
    title?: string; description?: string; actions?: React.ReactNode; children: React.ReactNode
  }) => <div data-testid="page"><h1>{title}</h1><p>{description}</p>{actions}{children}</div>,
  Button: ({ children, onClick, disabled }: {
    children: React.ReactNode; onClick?: () => void;
    variant?: string; size?: string; loading?: boolean; disabled?: boolean
  }) => <button onClick={onClick} disabled={disabled}>{children}</button>,
  Card: ({ children }: { children: React.ReactNode; className?: string }) =>
    <div data-testid="card">{children}</div>,
  CardHeader: ({ title }: { title?: string; description?: string }) => <div>{title}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Input: (props: {
    value?: string; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string
  }) => <input {...props} />,
  FormGroup: ({ children, label }: { children: React.ReactNode; label: string }) =>
    <div><label>{label}</label>{children}</div>,
  Select: ({ options, value, onChange }: {
    options: { value: string; label: string }[]
    value?: string; onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void
  }) => (
    <select value={value} onChange={onChange}>
      {options?.map((o: { value: string; label: string }) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  ),
  Badge: ({ children }: { children: React.ReactNode; variant?: string }) =>
    <span data-testid="badge">{children}</span>,
  Spinner: () => <div data-testid="spinner" />,
}))

const company = { id: 'c1', name: 'Acme Corp', slug: 'acme', role: 'owner', description: 'A company' }
const members = [
  { id: 'm1', userId: 'u1', email: 'owner@test.com', name: 'Owner', role: 'owner', joinedAt: '2024-01-01' },
  { id: 'm2', userId: 'u2', email: 'admin@test.com', name: 'Admin', role: 'admin', joinedAt: '2024-02-01' },
  { id: 'm3', userId: 'u3', email: 'member@test.com', name: 'Member', role: 'member', joinedAt: '2024-03-01' },
]

const pendingInvites = [
  { id: 'inv-1', companyId: 'c1', email: 'pending@test.com', role: 'member', status: 'pending', createdAt: '2024-04-01', expiresAt: '2024-04-08' },
]

describe('CompanyMembers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCompanyService.getById.mockResolvedValue(company)
    mockCompanyService.getMembers.mockResolvedValue(members)
    mockCompanyService.getInvites.mockResolvedValue(pendingInvites)
    mockCompanyService.inviteMember.mockResolvedValue({ status: 'added' })
    mockCompanyService.updateMemberRole.mockResolvedValue(undefined)
    mockCompanyService.removeMember.mockResolvedValue(undefined)
    mockCompanyService.cancelInvite.mockResolvedValue(undefined)
  })

  it('shows loading spinner initially', () => {
    mockCompanyService.getById.mockReturnValue(new Promise(() => {}))
    mockCompanyService.getMembers.mockReturnValue(new Promise(() => {}))

    render(<MemoryRouter><CompanyMembers /></MemoryRouter>)
    expect(screen.getByTestId('spinner')).toBeInTheDocument()
  })

  it('renders company name and members', async () => {
    render(<MemoryRouter><CompanyMembers /></MemoryRouter>)

    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument()
      expect(screen.getByText('owner@test.com')).toBeInTheDocument()
      expect(screen.getByText('admin@test.com')).toBeInTheDocument()
      expect(screen.getByText('member@test.com')).toBeInTheDocument()
    })
  })

  it('shows back button that navigates to /companies', async () => {
    render(<MemoryRouter><CompanyMembers /></MemoryRouter>)

    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText(/members.backButton/))
    expect(mockNavigate).toHaveBeenCalledWith('/companies')
  })

  it('shows invite form for owner role', async () => {
    render(<MemoryRouter><CompanyMembers /></MemoryRouter>)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('members.emailPlaceholder')).toBeInTheDocument()
    })
  })

  it('hides invite form for member role', async () => {
    mockCompanyService.getById.mockResolvedValue({ ...company, role: 'member' })
    mockCompanyService.getMembers.mockResolvedValue([
      { id: 'm1', userId: 'u1', email: 'member@test.com', name: 'Member', role: 'member', joinedAt: '2024-01-01' },
    ])

    render(<MemoryRouter><CompanyMembers /></MemoryRouter>)

    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    })
    expect(screen.queryByPlaceholderText('members.emailPlaceholder')).not.toBeInTheDocument()
  })

  it('submits invite form', async () => {
    render(<MemoryRouter><CompanyMembers /></MemoryRouter>)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('members.emailPlaceholder')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByPlaceholderText('members.emailPlaceholder'), {
      target: { value: 'new@test.com' },
    })
    fireEvent.click(screen.getByText('members.inviteButton'))

    await waitFor(() => {
      expect(mockCompanyService.inviteMember).toHaveBeenCalledWith('c1', {
        email: 'new@test.com', role: 'member',
      })
    })
  })

  it('shows pending invites section', async () => {
    render(<MemoryRouter><CompanyMembers /></MemoryRouter>)

    await waitFor(() => {
      expect(screen.getByText('members.pendingInvites')).toBeInTheDocument()
      expect(screen.getByText('pending@test.com')).toBeInTheDocument()
    })
  })

  it('cancels a pending invite', async () => {
    render(<MemoryRouter><CompanyMembers /></MemoryRouter>)

    await waitFor(() => {
      expect(screen.getByText('pending@test.com')).toBeInTheDocument()
    })

    const cancelButtons = screen.getAllByText('common.cancel')
    fireEvent.click(cancelButtons[0])

    await waitFor(() => {
      expect(mockCompanyService.cancelInvite).toHaveBeenCalledWith('c1', 'inv-1')
    })
  })

  it('calls removeMember on remove click', async () => {
    render(<MemoryRouter><CompanyMembers /></MemoryRouter>)

    await waitFor(() => {
      expect(screen.getByText('member@test.com')).toBeInTheDocument()
    })

    const removeButtons = screen.getAllByText('common.remove')
    fireEvent.click(removeButtons[removeButtons.length - 1])

    await waitFor(() => {
      expect(mockCompanyService.removeMember).toHaveBeenCalled()
    })
  })

  it('shows invite message after successful invite', async () => {
    mockCompanyService.inviteMember.mockResolvedValue({ status: 'invited' })

    render(<MemoryRouter><CompanyMembers /></MemoryRouter>)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('members.emailPlaceholder')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByPlaceholderText('members.emailPlaceholder'), {
      target: { value: 'new@test.com' },
    })
    fireEvent.click(screen.getByText('members.inviteButton'))

    await waitFor(() => {
      expect(screen.getByText('members.inviteSent')).toBeInTheDocument()
    })
  })
})
