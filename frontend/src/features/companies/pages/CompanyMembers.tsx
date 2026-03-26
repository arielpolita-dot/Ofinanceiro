import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../auth/hooks/useAuth'
import { companyService } from '../services/company.service'
import type { Company, CompanyMember, CompanyInvite } from '../services/company.types'
import {
  Page, Button, Card, CardHeader, CardContent,
  Input, FormGroup, Select, Badge, Spinner,
} from '../../../design-system'
import './CompanyMembers.css'

function canManageMembers(role: string): boolean {
  return role === 'owner' || role === 'admin'
}

function canChangeRoles(role: string): boolean {
  return role === 'owner'
}

function InviteMemberForm({ companyId, onInvited }: {
  companyId: string
  onInvited: () => void
}) {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('member')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!email.trim()) return
    setLoading(true)
    setMessage(null)
    try {
      const result = await companyService.inviteMember(companyId, { email: email.trim(), role })
      setEmail('')
      setRole('member')
      setMessage(result.status === 'invited'
        ? t('members.inviteSent')
        : t('members.memberAdded'))
      onInvited()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="members-invite-form">
      <FormGroup label={t('members.emailLabel')}>
        <Input
          placeholder={t('members.emailPlaceholder')}
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
        />
      </FormGroup>
      <FormGroup label={t('members.roleLabel')}>
        <Select
          value={role}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRole(e.target.value)}
          options={[
            { value: 'member', label: t('members.roleMember') },
            { value: 'admin', label: t('members.roleAdmin') },
          ]}
        />
      </FormGroup>
      <Button onClick={handleSubmit} loading={loading} disabled={!email.trim()}>
        {t('members.inviteButton')}
      </Button>
      {message && <span className="members-invite-message">{message}</span>}
    </div>
  )
}

function MemberRow({ member, companyId, companyRole, onUpdated }: {
  member: CompanyMember
  companyId: string
  companyRole: string
  onUpdated: () => void
}) {
  const { t } = useTranslation()
  const isOwner = canChangeRoles(companyRole)
  const isManager = canManageMembers(companyRole)
  const isMemberOwner = member.role === 'owner'

  const handleRoleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    await companyService.updateMemberRole(companyId, member.userId, { role: e.target.value })
    onUpdated()
  }

  const handleRemove = async () => {
    await companyService.removeMember(companyId, member.userId)
    onUpdated()
  }

  return (
    <div className="members-row">
      <div className="members-row-info">
        <span className="members-row-name">{member.name}</span>
        <span className="members-row-email">{member.email}</span>
      </div>
      <div className="members-row-actions">
        {isOwner && !isMemberOwner ? (
          <Select
            value={member.role}
            onChange={handleRoleChange}
            options={[
              { value: 'member', label: t('members.roleMember') },
              { value: 'admin', label: t('members.roleAdmin') },
            ]}
          />
        ) : (
          <Badge variant={isMemberOwner ? 'primary' : 'default'}>{member.role}</Badge>
        )}
        {isManager && !isMemberOwner && (
          <Button variant="ghost" size="sm" onClick={handleRemove}>{t('common.remove')}</Button>
        )}
      </div>
    </div>
  )
}

function InviteRow({ invite, companyId, onCanceled }: {
  invite: CompanyInvite
  companyId: string
  onCanceled: () => void
}) {
  const { t } = useTranslation()
  const [canceling, setCanceling] = useState(false)

  const handleCancel = async () => {
    setCanceling(true)
    try {
      await companyService.cancelInvite(companyId, invite.id)
      onCanceled()
    } finally {
      setCanceling(false)
    }
  }

  return (
    <div className="members-row">
      <div className="members-row-info">
        <span className="members-row-email">{invite.email}</span>
        <span className="members-row-meta">
          <Badge variant="warning">{t('members.pending')}</Badge>
          <span className="members-row-role">{invite.role}</span>
        </span>
      </div>
      <div className="members-row-actions">
        <Button variant="ghost" size="sm" onClick={handleCancel} loading={canceling}>
          {t('common.cancel')}
        </Button>
      </div>
    </div>
  )
}

export function CompanyMembers() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [company, setCompany] = useState<Company | null>(null)
  const [members, setMembers] = useState<CompanyMember[]>([])
  const [invites, setInvites] = useState<CompanyInvite[]>([])
  const [myRole, setMyRole] = useState<string>('member')
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!id) return
    try {
      const [companyData, rawMembers] = await Promise.all([
        companyService.getById(id),
        companyService.getMembers(id),
      ])
      // Flatten nested user object into member fields
      const flatMembers = rawMembers.map((m: CompanyMember & { user?: { name?: string; email?: string } }) => ({
        ...m,
        name: m.name || m.user?.name || '',
        email: m.email || m.user?.email || '',
      }))
      setCompany(companyData)
      setMembers(flatMembers)
      // Find current user's role
      const me = flatMembers.find((m: CompanyMember) => m.userId === user?.id)
      const role = me?.role || 'member'
      setMyRole(role)

      // Fetch invites if user can manage members
      if (canManageMembers(role)) {
        const pendingInvites = await companyService.getInvites(id)
        setInvites(pendingInvites)
      }
    } finally {
      setLoading(false)
    }
  }, [id, user?.id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return <div className="members-loading"><Spinner size="lg" /></div>
  }

  if (!company) {
    return <div className="members-empty">{t('members.companyNotFound')}</div>
  }

  const isManager = canManageMembers(myRole)

  return (
    <Page
      title={company.name}
      description={company.description || t('members.defaultDescription')}
      actions={
        <Button variant="ghost" onClick={() => navigate('/companies')}>
          &larr; {t('members.backButton')}
        </Button>
      }
    >
      {isManager && (
        <Card>
          <CardHeader title={t('members.inviteTitle')} description={t('members.inviteDescription')} />
          <CardContent>
            <InviteMemberForm companyId={company.id} onInvited={fetchData} />
          </CardContent>
        </Card>
      )}

      {isManager && invites.length > 0 && (
        <Card className="members-section-gap">
          <CardHeader
            title={t('members.pendingInvites')}
            description={t('members.pendingCount', { count: invites.length })}
          />
          <CardContent>
            <div className="members-list">
              {invites.map(inv => (
                <InviteRow
                  key={inv.id}
                  invite={inv}
                  companyId={company.id}
                  onCanceled={fetchData}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className={isManager ? 'members-section-gap' : ''}>
        <CardHeader
          title={t('members.membersTitle')}
          description={t('members.memberCount', { count: members.length })}
        />
        <CardContent>
          <div className="members-list">
            {members.map(m => (
              <MemberRow
                key={m.id}
                member={m}
                companyId={company.id}
                companyRole={myRole}
                onUpdated={fetchData}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </Page>
  )
}
