import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCompany } from '../hooks/useCompany'
import type { Company } from '../services/company.types'
import './CompanySwitcher.css'

function CompanyInitials({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return <span className="company-switcher-initials">{initials}</span>
}

function CompanyOption({ company, isActive, onSelect }: {
  company: Company
  isActive: boolean
  onSelect: (id: string) => void
}) {
  const handleClick = () => {
    if (!isActive) onSelect(company.id)
  }

  return (
    <button
      className={`company-switcher-item ${isActive ? 'company-switcher-item--active' : ''}`}
      onClick={handleClick}
      type="button"
    >
      <CompanyInitials name={company.name} />
      <div className="company-switcher-item-info">
        <span className="company-switcher-item-name">{company.name}</span>
        <span className="company-switcher-item-role">{company.role}</span>
      </div>
      {isActive && <span className="company-switcher-check">&#10003;</span>}
    </button>
  )
}

function EmptyCompanyState() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="company-switcher">
      <button
        className="company-switcher-trigger company-switcher-trigger--empty"
        onClick={() => navigate('/companies')}
        data-testid="company-switcher-create"
        type="button"
      >
        <span className="company-switcher-plus">+</span>
        <span className="company-switcher-name">{t('companySwitcher.createCompany')}</span>
      </button>
    </div>
  )
}

function SingleCompanyDisplay({ company }: { company: Company }) {
  return (
    <div className="company-switcher">
      <div
        className="company-switcher-trigger company-switcher-trigger--static"
        data-testid="company-switcher-trigger"
      >
        <CompanyInitials name={company.name} />
        <span className="company-switcher-name">{company.name}</span>
      </div>
    </div>
  )
}

function MultiCompanyDropdown({ companies, activeCompany, onSelect }: {
  companies: Company[]
  activeCompany: Company
  onSelect: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const handleSelect = (id: string) => {
    setOpen(false)
    onSelect(id)
  }

  return (
    <div className="company-switcher" ref={ref}>
      <button
        className="company-switcher-trigger"
        onClick={() => setOpen(!open)}
        data-testid="company-switcher-trigger"
        type="button"
      >
        <CompanyInitials name={activeCompany.name} />
        <span className="company-switcher-name">{activeCompany.name}</span>
        <svg
          className="company-switcher-arrow"
          data-testid="company-switcher-arrow"
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="currentColor"
        >
          <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      </button>

      {open && (
        <div className="company-switcher-dropdown">
          {companies.map(c => (
            <CompanyOption
              key={c.id}
              company={c}
              isActive={c.id === activeCompany.id}
              onSelect={handleSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function CompanySwitcher() {
  const { companies, activeCompany, switchCompany, isLoading } = useCompany()

  if (isLoading) return null

  if (companies.length === 0) {
    return <EmptyCompanyState />
  }

  if (companies.length === 1 && activeCompany) {
    return <SingleCompanyDisplay company={activeCompany} />
  }

  if (!activeCompany) return null

  return (
    <MultiCompanyDropdown
      companies={companies}
      activeCompany={activeCompany}
      onSelect={switchCompany}
    />
  )
}
