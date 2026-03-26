import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CompanySwitcher } from '../components/CompanySwitcher'

const mockUseCompany = vi.fn()
const mockNavigate = vi.fn()

vi.mock('../hooks/useCompany', () => ({
  useCompany: () => mockUseCompany(),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('CompanySwitcher', () => {
  const switchCompany = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing while loading', () => {
    mockUseCompany.mockReturnValue({
      companies: [],
      activeCompany: null,
      switchCompany,
      isLoading: true,
    })

    const { container } = render(
      <MemoryRouter><CompanySwitcher /></MemoryRouter>,
    )
    expect(container.firstChild).toBeNull()
  })

  it('shows "Criar Empresa" button when no companies', () => {
    mockUseCompany.mockReturnValue({
      companies: [],
      activeCompany: null,
      switchCompany,
      isLoading: false,
    })

    render(<MemoryRouter><CompanySwitcher /></MemoryRouter>)

    expect(screen.getByText('companySwitcher.createCompany')).toBeInTheDocument()
    expect(screen.getByTestId('company-switcher-create')).toBeInTheDocument()
  })

  it('navigates to /companies when "Criar Empresa" clicked', () => {
    mockUseCompany.mockReturnValue({
      companies: [],
      activeCompany: null,
      switchCompany,
      isLoading: false,
    })

    render(<MemoryRouter><CompanySwitcher /></MemoryRouter>)

    fireEvent.click(screen.getByTestId('company-switcher-create'))
    expect(mockNavigate).toHaveBeenCalledWith('/companies')
  })

  it('shows company name without dropdown when only 1 company', () => {
    mockUseCompany.mockReturnValue({
      companies: [{ id: 'c1', name: 'Acme', slug: 'acme', role: 'owner' }],
      activeCompany: { id: 'c1', name: 'Acme', slug: 'acme', role: 'owner' },
      switchCompany,
      isLoading: false,
    })

    render(<MemoryRouter><CompanySwitcher /></MemoryRouter>)

    expect(screen.getByText('Acme')).toBeInTheDocument()
    expect(screen.queryByTestId('company-switcher-arrow')).not.toBeInTheDocument()
  })

  it('does not open dropdown on click when only 1 company', () => {
    mockUseCompany.mockReturnValue({
      companies: [{ id: 'c1', name: 'Acme', slug: 'acme', role: 'owner' }],
      activeCompany: { id: 'c1', name: 'Acme', slug: 'acme', role: 'owner' },
      switchCompany,
      isLoading: false,
    })

    render(<MemoryRouter><CompanySwitcher /></MemoryRouter>)

    const trigger = screen.getByTestId('company-switcher-trigger')
    fireEvent.click(trigger)
    expect(screen.queryByText('owner')).not.toBeInTheDocument()
  })

  it('shows dropdown arrow when multiple companies', () => {
    mockUseCompany.mockReturnValue({
      companies: [
        { id: 'c1', name: 'Acme', slug: 'acme', role: 'owner' },
        { id: 'c2', name: 'Beta', slug: 'beta', role: 'member' },
      ],
      activeCompany: { id: 'c1', name: 'Acme', slug: 'acme', role: 'owner' },
      switchCompany,
      isLoading: false,
    })

    render(<MemoryRouter><CompanySwitcher /></MemoryRouter>)

    expect(screen.getByTestId('company-switcher-arrow')).toBeInTheDocument()
  })

  it('opens dropdown and shows company list on click', () => {
    mockUseCompany.mockReturnValue({
      companies: [
        { id: 'c1', name: 'Acme', slug: 'acme', role: 'owner' },
        { id: 'c2', name: 'Beta', slug: 'beta', role: 'member' },
      ],
      activeCompany: { id: 'c1', name: 'Acme', slug: 'acme', role: 'owner' },
      switchCompany,
      isLoading: false,
    })

    render(<MemoryRouter><CompanySwitcher /></MemoryRouter>)

    fireEvent.click(screen.getByTestId('company-switcher-trigger'))
    expect(screen.getByText('Beta')).toBeInTheDocument()
  })

  it('calls switchCompany when selecting a different company', () => {
    mockUseCompany.mockReturnValue({
      companies: [
        { id: 'c1', name: 'Acme', slug: 'acme', role: 'owner' },
        { id: 'c2', name: 'Beta', slug: 'beta', role: 'member' },
      ],
      activeCompany: { id: 'c1', name: 'Acme', slug: 'acme', role: 'owner' },
      switchCompany,
      isLoading: false,
    })

    render(<MemoryRouter><CompanySwitcher /></MemoryRouter>)

    fireEvent.click(screen.getByTestId('company-switcher-trigger'))
    fireEvent.click(screen.getByText('Beta'))

    expect(switchCompany).toHaveBeenCalledWith('c2')
  })

  it('does not call switchCompany when selecting active company', () => {
    mockUseCompany.mockReturnValue({
      companies: [
        { id: 'c1', name: 'Acme', slug: 'acme', role: 'owner' },
        { id: 'c2', name: 'Beta', slug: 'beta', role: 'member' },
      ],
      activeCompany: { id: 'c1', name: 'Acme', slug: 'acme', role: 'owner' },
      switchCompany,
      isLoading: false,
    })

    render(<MemoryRouter><CompanySwitcher /></MemoryRouter>)

    fireEvent.click(screen.getByTestId('company-switcher-trigger'))

    const acmeItems = screen.getAllByText('Acme')
    const dropdownItem = acmeItems.find(el => el.closest('.company-switcher-item'))
    if (dropdownItem) fireEvent.click(dropdownItem)

    expect(switchCompany).not.toHaveBeenCalled()
  })
})
