import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCompany } from '../hooks/useCompany'
import { companyService } from '../services/company.service'
import type { Company } from '../services/company.types'
import {
  Page, Card, CardHeader, CardContent, Button, Input,
  FormGroup, Badge, EmptyState, Spinner,
  Table, TableHead, TableBody, TableRow, TableHeader, TableCell,
} from '../../../design-system'
import { CompaniesIcon } from '../../../components/icons'
import './Companies.css'

function CreateCompanyForm({ onSubmit, onCancel }: {
  onSubmit: (data: { name: string; document: string }) => Promise<void>
  onCancel: () => void
}) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [document, setDocument] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim()) return
    setLoading(true)
    try {
      await onSubmit({ name: name.trim(), document: document.trim() })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="companies-section-gap">
      <CardHeader title={t('companies.createTitle')} description={t('companies.createDescription')} />
      <CardContent>
        <div className="companies-create-form">
          <div className="companies-create-row">
            <FormGroup label={t('companies.companyName')}>
              <Input
                placeholder={t('companies.companyName')}
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              />
            </FormGroup>
            <FormGroup label={t('companies.cnpj')}>
              <Input
                placeholder={t('companies.cnpjPlaceholder')}
                value={document}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDocument(e.target.value)}
              />
            </FormGroup>
          </div>
          <div className="companies-create-actions">
            <Button onClick={handleSubmit} loading={loading} disabled={!name.trim()}>
              {t('companies.createButton')}
            </Button>
            <Button variant="ghost" onClick={onCancel}>
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function CompanyActions({ company, onDeleted }: {
  company: Company
  onDeleted: () => void
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm(t('companies.confirmDelete', { name: company.name }))) return
    setDeleting(true)
    try {
      await companyService.delete(company.id)
      onDeleted()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="companies-actions">
      <Button variant="ghost" size="sm" onClick={() => navigate(`/companies/${company.id}`)}>
        {t('companies.members')}
      </Button>
      {company.role === 'owner' && (
        <Button variant="ghost" size="sm" onClick={handleDelete} loading={deleting}>
          {t('common.delete')}
        </Button>
      )}
    </div>
  )
}

export function Companies() {
  const { t } = useTranslation()
  const { companies, isLoading, createCompany, refresh } = useCompany()
  const [showForm, setShowForm] = useState(false)

  const handleCreate = async (data: { name: string; document: string }) => {
    await createCompany({ name: data.name, document: data.document || undefined })
    setShowForm(false)
  }

  if (isLoading) {
    return <div className="companies-loading"><Spinner size="lg" /></div>
  }

  return (
    <Page
      title={t('companies.title')}
      description={t('companies.description')}
      actions={
        companies.length > 0 ? (
          <Button onClick={() => setShowForm(true)} disabled={showForm}>
            {t('companies.newCompany')}
          </Button>
        ) : undefined
      }
    >
      {showForm && (
        <CreateCompanyForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
      )}

      {companies.length === 0 && !showForm ? (
        <EmptyState
          icon={<CompaniesIcon />}
          title={t('companies.emptyTitle')}
          description={t('companies.emptyDescription')}
          action={<Button onClick={() => setShowForm(true)}>{t('companies.newCompany')}</Button>}
        />
      ) : (
        <Card>
          <CardHeader
            title={t('companies.yourCompanies')}
            description={t('companies.companyCount', { count: companies.length })}
          />
          <CardContent>
            <Table hoverable>
              <TableHead>
                <TableRow>
                  <TableHeader>{t('companies.tableHeaderName')}</TableHeader>
                  <TableHeader>{t('companies.tableHeaderCnpj')}</TableHeader>
                  <TableHeader>{t('companies.tableHeaderRole')}</TableHeader>
                  <TableHeader style={{ textAlign: 'right' }}>{t('companies.tableHeaderActions')}</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {companies.map(c => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <span className="companies-table-name">{c.name}</span>
                      {c.description && (
                        <span className="companies-table-desc">{c.description}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="companies-table-doc">{c.document || '—'}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.role === 'owner' ? 'primary' : 'default'}>
                        {c.role}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ textAlign: 'right' }}>
                      <CompanyActions company={c} onDeleted={refresh} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </Page>
  )
}
