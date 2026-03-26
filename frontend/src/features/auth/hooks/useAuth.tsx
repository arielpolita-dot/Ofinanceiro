/**
 * useAuth Hook - Autenticacao via httpOnly cookies (BFF pattern)
 *
 * Fluxo: login() -> backend -> Authify -> callback -> httpOnly cookie
 * Todas requisicoes usam credentials: 'include'
 */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import {
  trackAuthLogout,
  setUserId as setAnalyticsUserId,
} from '../../../services/analytics'
import { logger } from '../../../utils/logger'

interface User {
  id: string
  email: string
  name: string | null
  avatar: string | null
  emailVerified?: boolean
  projectId?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: () => void
  logout: () => Promise<void>
}

interface AuthSetters {
  setUser: (user: User | null) => void
  setIsLoading: (loading: boolean) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

const API_URL = import.meta.env.VITE_API_URL
const STORAGE_PREFIX = import.meta.env.VITE_STORAGE_PREFIX || 'app'

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

function clearAuthAndRedirect(): void {
  localStorage.removeItem(`${STORAGE_PREFIX}_user`)
  window.location.href = `${API_URL}/api/auth/login`
}

function loadStoredUser(): User | null {
  const stored = localStorage.getItem(`${STORAGE_PREFIX}_user`)
  if (!stored) return null
  try {
    const parsed = JSON.parse(stored)
    return parsed?.id ? parsed : null
  } catch {
    return null
  }
}

async function tryRefreshToken(
  signal: AbortSignal,
  { setUser, setIsLoading }: AuthSetters,
): Promise<void> {
  try {
    const userData = loadStoredUser()
    if (!userData) { clearAuthAndRedirect(); return }

    logger.auth('Attempting refresh for user:', userData.id)

    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userData.id }),
    })

    if (response.ok) {
      const data = await response.json()
      logger.auth('Token refreshed successfully')
      localStorage.setItem(`${STORAGE_PREFIX}_user`, JSON.stringify(data.user))
      setUser(data.user)
      setIsLoading(false)
    } else {
      logger.auth('Refresh failed, redirecting to login...')
      clearAuthAndRedirect()
    }
  } catch (error) {
    if (isAbortError(error)) return
    logger.error('Refresh error:', error)
    clearAuthAndRedirect()
  }
}

async function checkAuth(
  signal: AbortSignal,
  setters: AuthSetters,
): Promise<void> {
  try {
    logger.auth('Checking authentication status...')

    const response = await fetch(`${API_URL}/api/auth/status`, {
      method: 'GET',
      credentials: 'include',
      signal,
      headers: { 'Content-Type': 'application/json' },
    })

    if (response.ok) {
      const data = await response.json()
      if (data.authenticated && data.user) {
        logger.auth('User authenticated:', data.user.email)
        setters.setUser(data.user)
        localStorage.setItem(`${STORAGE_PREFIX}_user`, JSON.stringify(data.user))
        setAnalyticsUserId(data.user.id)
        setters.setIsLoading(false)
      } else {
        await tryRefreshToken(signal, setters)
      }
    } else if (response.status === 401) {
      await tryRefreshToken(signal, setters)
    } else {
      clearAuthAndRedirect()
    }
  } catch (error) {
    if (isAbortError(error)) return
    logger.error('Failed to check auth status:', error)
    clearAuthAndRedirect()
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    const setters: AuthSetters = { setUser, setIsLoading }

    if (window.location.pathname === '/auth/callback') {
      setIsLoading(false)
      return () => controller.abort()
    }

    const justAuth = sessionStorage.getItem(`${STORAGE_PREFIX}_just_authenticated`)
    const storedUser = loadStoredUser()

    if (justAuth && storedUser) {
      setUser(storedUser)
      setIsLoading(false)
      sessionStorage.removeItem(`${STORAGE_PREFIX}_just_authenticated`)
      return () => controller.abort()
    }

    if (storedUser) setUser(storedUser)

    checkAuth(controller.signal, setters)
    return () => controller.abort()
  }, [])

  const login = () => {
    logger.auth('Redirecting to login...')
    window.location.href = `${API_URL}/api/auth/login`
  }

  const logout = async () => {
    try {
      logger.auth('Logging out...')
      trackAuthLogout()
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      logger.error('Logout error:', error)
    } finally {
      localStorage.removeItem(`${STORAGE_PREFIX}_user`)
      setUser(null)
      window.location.href = `${API_URL}/api/auth/login`
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated: !!user, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
