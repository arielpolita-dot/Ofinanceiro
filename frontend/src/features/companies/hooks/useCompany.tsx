import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useAuth } from '../../auth/hooks/useAuth'
import { companyService } from '../services/company.service'
import type { Company, CreateCompanyDto } from '../services/company.types'

interface CompanyContextType {
  companies: Company[]
  activeCompany: Company | null
  isLoading: boolean
  switchCompany: (id: string) => Promise<void>
  createCompany: (data: CreateCompanyDto) => Promise<Company>
  refresh: () => Promise<void>
}

const CompanyContext = createContext<CompanyContextType | null>(null)

const STORAGE_PREFIX = import.meta.env.VITE_STORAGE_PREFIX || 'app'
const STORAGE_KEY = `${STORAGE_PREFIX}_active_company_id`

function resolveActiveCompany(
  companies: Company[],
  projectId?: string,
): Company | null {
  if (companies.length === 0) return null

  if (projectId) {
    const match = companies.find(c => c.id === projectId)
    if (match) return match
  }

  const storedId = localStorage.getItem(STORAGE_KEY)
  if (storedId) {
    const stored = companies.find(c => c.id === storedId)
    if (stored) return stored
  }

  return companies[0]
}

export function CompanyProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const [companies, setCompanies] = useState<Company[]>([])
  const [activeCompany, setActiveCompany] = useState<Company | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchCompanies = useCallback(async () => {
    try {
      const data = await companyService.getAll()
      setCompanies(data)
      return data
    } catch {
      setCompanies([])
      return []
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setIsLoading(false)
      return
    }

    let cancelled = false

    const load = async () => {
      const data = await fetchCompanies()
      if (cancelled) return

      const active = resolveActiveCompany(data, user.projectId)
      setActiveCompany(active)

      if (active) {
        localStorage.setItem(STORAGE_KEY, active.id)
      }

      setIsLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [isAuthenticated, user, fetchCompanies])

  const switchCompany = useCallback(async (id: string) => {
    localStorage.setItem(STORAGE_KEY, id)
    await companyService.switchCompany(id)
    window.location.reload()
  }, [])

  const createCompany = useCallback(async (data: CreateCompanyDto) => {
    const created = await companyService.create(data)
    await fetchCompanies()
    return created
  }, [fetchCompanies])

  const refresh = useCallback(async () => {
    const data = await fetchCompanies()
    const active = resolveActiveCompany(data, user?.projectId)
    setActiveCompany(active)
    if (active) {
      localStorage.setItem(STORAGE_KEY, active.id)
    }
  }, [fetchCompanies, user?.projectId])

  return (
    <CompanyContext.Provider
      value={{ companies, activeCompany, isLoading, switchCompany, createCompany, refresh }}
    >
      {children}
    </CompanyContext.Provider>
  )
}

export function useCompany() {
  const context = useContext(CompanyContext)
  if (!context) {
    throw new Error('useCompany must be used within CompanyProvider')
  }
  return context
}
