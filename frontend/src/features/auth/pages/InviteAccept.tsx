import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'
import { companyService } from '../../companies/services/company.service'
import type { InviteInfo } from '../../companies/services/company.types'
import { Spinner, Button, Card, CardContent } from '../../../design-system'
import './InviteAccept.css'

type PageState = 'loading' | 'info' | 'accepted' | 'error'

function InviteInfoCard({ info, onAccept, accepting }: {
  info: InviteInfo
  onAccept: () => void
  accepting: boolean
}) {
  const { t } = useTranslation()

  const expiredMessage = info.status === 'expired'
    ? t('invite.expired')
    : t('invite.unavailable')

  return (
    <Card>
      <CardContent>
        <div className="invite-accept-content">
          <h2 className="invite-accept-title">{t('invite.title', { companyName: info.companyName })}</h2>
          <p className="invite-accept-text">
            <strong>{info.inviterName}</strong>{' '}
            {t('invite.invitedByPrefix')}{' '}
            <strong>{info.companyName}</strong>.
          </p>
          {info.status === 'pending' ? (
            <Button onClick={onAccept} loading={accepting}>
              {t('invite.acceptButton')}
            </Button>
          ) : (
            <p className="invite-accept-expired">{expiredMessage}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function AcceptedCard({ companyName }: { companyName: string }) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <Card>
      <CardContent>
        <div className="invite-accept-content">
          <h2 className="invite-accept-title">{t('invite.acceptedTitle')}</h2>
          <p className="invite-accept-text">
            {t('invite.acceptedPrefix')}{' '}
            <strong>{companyName}</strong>.
          </p>
          <Button onClick={() => navigate('/companies')}>
            {t('invite.goToCompanies')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function InviteAccept() {
  const { t } = useTranslation()
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [state, setState] = useState<PageState>('loading')
  const [accepting, setAccepting] = useState(false)
  const [info, setInfo] = useState<InviteInfo | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    loadInviteInfo(token)
  }, [token])

  const loadInviteInfo = async (inviteToken: string) => {
    try {
      const data = await companyService.getInviteInfo(inviteToken)
      setInfo(data)
      setState('info')
    } catch {
      setError(t('invite.notFound'))
      setState('error')
    }
  }

  const handleAccept = async () => {
    if (!token) return

    if (!isAuthenticated && !authLoading) {
      const returnUrl = encodeURIComponent(`/invite/${token}`)
      const apiUrl = import.meta.env.VITE_API_URL
      window.location.href = `${apiUrl}/api/auth/login?returnTo=${returnUrl}`
      return
    }

    setAccepting(true)
    try {
      await companyService.acceptInvite(token)
      setState('accepted')
    } catch {
      setError(t('invite.acceptError'))
      setState('error')
    } finally {
      setAccepting(false)
    }
  }

  if (state === 'loading' || authLoading) {
    return (
      <div className="invite-accept-page">
        <Spinner size="lg" />
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="invite-accept-page">
        <Card>
          <CardContent>
            <div className="invite-accept-content">
              <h2 className="invite-accept-title">{t('invite.errorTitle')}</h2>
              <p className="invite-accept-error">{error}</p>
              <Button onClick={() => navigate('/')}>{t('invite.backToHome')}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (state === 'accepted' && info) {
    return (
      <div className="invite-accept-page">
        <AcceptedCard companyName={info.companyName} />
      </div>
    )
  }

  if (state === 'info' && info) {
    return (
      <div className="invite-accept-page">
        <InviteInfoCard
          info={info}
          onAccept={handleAccept}
          accepting={accepting}
        />
      </div>
    )
  }

  return null
}
