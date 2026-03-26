import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Companies } from '../pages/Companies'

const { mockUseCompany, mockNavigate, mockCompanyService } = vi.hoisted(() => ({
  mockUseCompany: vi.fn(),
  mockNavigate: vi.fn(),
  mockCompanyService: {
    create: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('../hooks/useCompany', () => ({
  useCompany: () => mockUseCompany(),
}))

vi.mock('../services/company.service', () => ({
  companyService: mockCompanyService,
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../../../design-system', () => ({
  Page: ({ title, description, actions, children }: {
    title?: string; description?: string; actions?: React.ReactNode; children: React.ReactNode
  }) => <div data-testid="page"><h1>{title}</h1><p>{description}</p>{actions}{children}</div>,
  Button: ({ children, onClick, disabled }: {
    children: React.ReactNode; onClick?: () => void;
    variant?: string; size?: string; loading?: boolean; disabled?: boolean
  }) => <button onClick={onClick} disabled={disabled}>{children}</button>,
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) =>
    <div data-testid="card" className={className}>{children}</div>,
  CardHeader: ({ title }: { title?: string; description?: string }) =>
    <div>{title}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Input: (props: {
    value?: string; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string
  }) => <input {...props} />,
  FormGroup: ({ children, label }: { children: React.ReactNode; label: string }) =>
    <div><label>{label}</label>{children}</div>,
  Badge: ({ children }: { children: React.ReactNode; variant?: string }) =>
    <span data-testid="badge">{children}</span>,
  EmptyState: ({ title, description, action }: {
    title: string; description?: string; action?: React.ReactNode; icon?: React.ReactNode
  }) => <div data-testid="empty-state"><h3>{title}</h3><p>{description}</p>{action}</div>,
  Spinner: (_props: { size?: string }) => <div data-testid="spinner" />,
  Table: ({ children }: { children: React.ReactNode; hoverable?: boolean }) =>
    <table>{children}</table>,
  TableHead: ({ children }: { children: React.ReactNode }) => <thead>{children}</thead>,
  TableBody: ({ children }: { children: React.ReactNode }) => <tbody>{children}</tbody>,
  TableRow: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) =>
    <tr onClick={onClick}>{children}</tr>,
  TableHeader: ({ children }: { children: React.ReactNode }) => <th>{children}</th>,
  TableCell: ({ children }: { children: React.ReactNode }) => <td>{children}</td>,
}))

const companies = [
  { id: 'c1', name: 'Acme Corp', slug: 'acme', role: 'owner', description: 'Main company' },
  { id: 'c2', name: 'Beta Inc', slug: 'beta', role: 'member' },
]

describe('Companies', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCompanyService.create.mockResolvedValue({ id: 'c3', name: 'New Co' })
  })

  it('shows loading spinner', () => {
    mockUseCompany.mockReturnValue({
      companies: [], isLoading: true, createCompany: vi.fn(), refresh: vi.fn(),
    })
    render(<MemoryRouter><Companies /></MemoryRouter>)
    expect(screen.getByTestId('spinner')).toBeInTheDocument()
  })

  it('shows empty state when no companies', () => {
    mockUseCompany.mockReturnValue({
      companies: [], isLoading: false, createCompany: vi.fn(), refresh: vi.fn(),
    })
    render(<MemoryRouter><Companies /></MemoryRouter>)
    expect(screen.getByTestId('empty-state')).toBeInTheDocument()
  })

  it('renders company cards with name and role', () => {
    mockUseCompany.mockReturnValue({
      companies, isLoading: false, createCompany: vi.fn(), refresh: vi.fn(),
    })
    render(<MemoryRouter><Companies /></MemoryRouter>)

    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    expect(screen.getByText('Beta Inc')).toBeInTheDocument()
    expect(screen.getByText('owner')).toBeInTheDocument()
    expect(screen.getByText('member')).toBeInTheDocument()
  })

  it('navigates to company detail on "Membros" click', () => {
    mockUseCompany.mockReturnValue({
      companies, isLoading: false, createCompany: vi.fn(), refresh: vi.fn(),
    })
    render(<MemoryRouter><Companies /></MemoryRouter>)

    const buttons = screen.getAllByText('companies.members')
    fireEvent.click(buttons[0])

    expect(mockNavigate).toHaveBeenCalledWith('/companies/c1')
  })

  it('shows create form when "Nova Empresa" clicked', () => {
    mockUseCompany.mockReturnValue({
      companies, isLoading: false, createCompany: vi.fn(), refresh: vi.fn(),
    })
    render(<MemoryRouter><Companies /></MemoryRouter>)

    fireEvent.click(screen.getByText('companies.newCompany'))
    expect(screen.getByPlaceholderText('companies.companyName')).toBeInTheDocument()
  })

  it('calls createCompany on form submit', async () => {
    const createCompany = vi.fn().mockResolvedValue({ id: 'c3' })
    mockUseCompany.mockReturnValue({
      companies, isLoading: false, createCompany, refresh: vi.fn(),
    })
    render(<MemoryRouter><Companies /></MemoryRouter>)

    fireEvent.click(screen.getByText('companies.newCompany'))
    fireEvent.change(screen.getByPlaceholderText('companies.companyName'), {
      target: { value: 'New Company' },
    })
    fireEvent.click(screen.getByText('companies.createButton'))

    await waitFor(() => {
      expect(createCompany).toHaveBeenCalledWith({ name: 'New Company' })
    })
  })
})
