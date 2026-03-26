import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Spinner, Text, Alert } from '../../../design-system'
import { logger } from '../../../utils/logger'

const API_URL = import.meta.env.VITE_API_URL
const STORAGE_PREFIX = import.meta.env.VITE_STORAGE_PREFIX || 'app'

/**
 * AuthCallback - Handles OAuth callback from Auth service
 *
 * This page receives the authorization code from Auth, exchanges it
 * for an access token via the backend. The token is stored in httpOnly
 * cookie (not localStorage) for security against XSS attacks.
 */
export function AuthCallback() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      const errorParam = params.get('error')

      if (errorParam) {
        logger.error('AuthCallback: OAuth error:', errorParam)

        // Show user-friendly message for session expired
        if (errorParam === 'session_expired') {
          const description = params.get('error_description') || 'Your session has expired.'
          logger.auth('Session expired, redirecting to login...')
          setError(description)
        } else {
          setError(errorParam)
        }

        // Redirect immediately for session expired (user expects this)
        const delay = errorParam === 'session_expired' ? 500 : 2000
        setTimeout(() => {
          window.location.href = `${API_URL}/api/auth/login`
        }, delay)
        return
      }

      if (!code) {
        logger.auth('No code received, redirecting to login...')
        window.location.href = `${API_URL}/api/auth/login`
        return
      }

      try {
        logger.auth('Exchanging code for token...')

        const response = await fetch(`${API_URL}/api/auth/callback`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || 'Authentication failed')
        }

        const data = await response.json()
        logger.auth('Authentication successful, cookie set by server')
        logger.auth('Response data:', data)

        // Store user info for reference
        localStorage.setItem(`${STORAGE_PREFIX}_user`, JSON.stringify(data.user))

        // Set flag to indicate we just authenticated (prevents redirect loop)
        sessionStorage.setItem(`${STORAGE_PREFIX}_just_authenticated`, 'true')

        // Use window.location for full page reload to ensure cookies are properly set
        // navigate() doesn't trigger a full reload, which can cause issues with httpOnly cookies
        logger.auth('Redirecting to app...')
        window.location.href = '/'
      } catch (err) {
        logger.error('AuthCallback error:', err)
        setError(err instanceof Error ? err.message : 'Authentication failed')
        setTimeout(() => {
          window.location.href = `${API_URL}/api/auth/login`
        }, 2000)
      }
    }

    handleCallback()
  }, [navigate])

  return (
    <div className="auth-callback-container">
      <div className="auth-callback-content">
        {error ? (
          <>
            <Alert variant="danger">{error}</Alert>
            <Text variant="body-sm" color="muted" align="center">{t('auth.redirectingToLogin')}</Text>
          </>
        ) : (
          <>
            <Spinner size="lg" />
            <Text variant="body-sm" color="muted" align="center">{t('auth.authenticating')}</Text>
          </>
        )}
      </div>
    </div>
  )
}
