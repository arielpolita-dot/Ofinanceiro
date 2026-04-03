import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { AuthCallback } from '../pages/AuthCallback'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

function mockWindowLocation(search: string) {
  let hrefValue = `http://localhost/auth/callback${search}`
  Object.defineProperty(window, 'location', {
    writable: true,
    configurable: true,
    value: {
      href: hrefValue,
      search,
      pathname: '/auth/callback',
      origin: 'http://localhost',
      assign: vi.fn(),
      replace: vi.fn(),
    },
  })
  // Intercept href setter to prevent navigation
  Object.defineProperty(window.location, 'href', {
    get: () => hrefValue,
    set: (v: string) => { hrefValue = v },
    configurable: true,
  })
  return {
    getHref: () => hrefValue,
  }
}

describe('AuthCallback', () => {
  const originalLocation = window.location
  const originalFetch = globalThis.fetch

  afterEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(window, 'location', {
      writable: true,
      configurable: true,
      value: originalLocation,
    })
    globalThis.fetch = originalFetch
    localStorage.clear()
  })

  it('shows authenticating spinner when code present', () => {
    mockWindowLocation('?code=abc123')
    globalThis.fetch = vi.fn().mockReturnValue(new Promise(() => {}))

    render(<AuthCallback />)
    expect(screen.getByText('auth.authenticating')).toBeInTheDocument()
  })

  it('shows error message on OAuth error param', async () => {
    mockWindowLocation('?error=access_denied')

    render(<AuthCallback />)

    await waitFor(() => {
      expect(screen.getByText('access_denied')).toBeInTheDocument()
    })
    expect(screen.getByText('auth.redirectingToLogin')).toBeInTheDocument()
  })

  it('shows session expired description', async () => {
    mockWindowLocation('?error=session_expired&error_description=Your+session+has+expired.')

    render(<AuthCallback />)

    await waitFor(() => {
      expect(screen.getByText('Your session has expired.')).toBeInTheDocument()
    })
  })

  it('redirects to login when no code present', async () => {
    const loc = mockWindowLocation('')

    render(<AuthCallback />)

    await waitFor(() => {
      expect(loc.getHref()).toContain('/api/auth/login')
    })
  })

  it('calls backend to exchange code', async () => {
    mockWindowLocation('?code=valid-code')

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        user: { id: '1', email: 'test@test.com', name: 'Test' },
      }),
    })

    render(<AuthCallback />)

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/callback'),
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify({ code: 'valid-code' }),
        }),
      )
    })
  })

  it('stores user in localStorage on successful exchange', async () => {
    mockWindowLocation('?code=valid-code')
    const userData = { id: '1', email: 'test@test.com', name: 'Test' }

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ user: userData }),
    })

    render(<AuthCallback />)

    await waitFor(() => {
      // STORAGE_PREFIX comes from import.meta.env; check both possible keys
      const stored = localStorage.getItem('app_user') ?? localStorage.getItem('ofinanceiro_user')
      expect(stored).toBe(JSON.stringify(userData))
    })
  })

  it('redirects to / after successful exchange', async () => {
    const loc = mockWindowLocation('?code=valid-code')

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        user: { id: '1', email: 'test@test.com', name: 'Test' },
      }),
    })

    render(<AuthCallback />)

    await waitFor(() => {
      expect(loc.getHref()).toBe('/')
    })
  })

  it('shows error on failed code exchange', async () => {
    mockWindowLocation('?code=bad-code')

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ message: 'Invalid code' }),
    })

    render(<AuthCallback />)

    await waitFor(() => {
      expect(screen.getByText('Invalid code')).toBeInTheDocument()
    })
  })
})
