import { render, screen, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetch = vi.fn()
global.fetch = mockFetch as any

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }))

const STORAGE_PREFIX = 'app-template'

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    delete (window as any).location
    ;(window as any).location = { href: '', reload: vi.fn() }
  })

  it('exports AuthProvider and useAuth', async () => {
    const mod = await import('./useAuth')
    expect(mod.AuthProvider).toBeDefined()
    expect(mod.useAuth).toBeDefined()
  })

  it('AuthProvider renders children', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ authenticated: true, user: { id: '1', email: 'a@b.com', name: 'A' }, companies: [] }),
    })
    const { AuthProvider } = await import('./useAuth')
    render(<AuthProvider><div>Child</div></AuthProvider>)
    expect(screen.getByText('Child')).toBeInTheDocument()
  })

  it('redirects to login when not authenticated', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ authenticated: false }),
    })
    const { AuthProvider } = await import('./useAuth')
    render(<AuthProvider><div>Child</div></AuthProvider>)
    await waitFor(() => {
      expect(window.location.href).toContain('auth')
    }, { timeout: 3000 })
  })
})
