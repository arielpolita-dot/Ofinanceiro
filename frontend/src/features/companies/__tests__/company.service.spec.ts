import { describe, it, expect, vi, beforeEach } from 'vitest'
import { companyService } from '../services/company.service'
import { api } from '../../../services/api'

vi.mock('../../../services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('companyService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAll', () => {
    it('calls GET /companies', async () => {
      const companies = [{ id: '1', name: 'Acme', slug: 'acme', role: 'owner' }]
      vi.mocked(api.get).mockResolvedValueOnce(companies)

      const result = await companyService.getAll()

      expect(api.get).toHaveBeenCalledWith('/companies')
      expect(result).toEqual(companies)
    })
  })

  describe('getById', () => {
    it('calls GET /companies/:id', async () => {
      const company = { id: '1', name: 'Acme', slug: 'acme', role: 'owner' }
      vi.mocked(api.get).mockResolvedValueOnce(company)

      const result = await companyService.getById('1')

      expect(api.get).toHaveBeenCalledWith('/companies/1')
      expect(result).toEqual(company)
    })
  })

  describe('create', () => {
    it('calls POST /companies with data', async () => {
      const data = { name: 'New Corp' }
      const created = { id: '2', name: 'New Corp', slug: 'new-corp', role: 'owner' }
      vi.mocked(api.post).mockResolvedValueOnce(created)

      const result = await companyService.create(data)

      expect(api.post).toHaveBeenCalledWith('/companies', data)
      expect(result).toEqual(created)
    })
  })

  describe('update', () => {
    it('calls PATCH /companies/:id with data', async () => {
      const data = { name: 'Updated Corp' }
      const updated = { id: '1', name: 'Updated Corp', slug: 'acme', role: 'owner' }
      vi.mocked(api.patch).mockResolvedValueOnce(updated)

      const result = await companyService.update('1', data)

      expect(api.patch).toHaveBeenCalledWith('/companies/1', data)
      expect(result).toEqual(updated)
    })
  })

  describe('delete', () => {
    it('calls DELETE /companies/:id', async () => {
      vi.mocked(api.delete).mockResolvedValueOnce(undefined)

      await companyService.delete('1')

      expect(api.delete).toHaveBeenCalledWith('/companies/1')
    })
  })

  describe('switchCompany', () => {
    it('calls POST /companies/:id/switch', async () => {
      const response = { token: 'new-jwt-token' }
      vi.mocked(api.post).mockResolvedValueOnce(response)

      const result = await companyService.switchCompany('2')

      expect(api.post).toHaveBeenCalledWith('/companies/2/switch')
      expect(result).toEqual(response)
    })
  })

  describe('getMembers', () => {
    it('calls GET /companies/:id/members', async () => {
      const members = [{ id: 'm1', userId: 'u1', email: 'a@b.com', name: 'A', role: 'admin', joinedAt: '2024-01-01' }]
      vi.mocked(api.get).mockResolvedValueOnce(members)

      const result = await companyService.getMembers('1')

      expect(api.get).toHaveBeenCalledWith('/companies/1/members')
      expect(result).toEqual(members)
    })
  })

  describe('inviteMember', () => {
    it('calls POST /companies/:id/members with data', async () => {
      const data = { email: 'new@user.com', role: 'member' }
      vi.mocked(api.post).mockResolvedValueOnce(undefined)

      await companyService.inviteMember('1', data)

      expect(api.post).toHaveBeenCalledWith('/companies/1/members', data)
    })
  })

  describe('updateMemberRole', () => {
    it('calls PATCH /companies/:id/members/:userId', async () => {
      const data = { role: 'admin' }
      vi.mocked(api.patch).mockResolvedValueOnce(undefined)

      await companyService.updateMemberRole('1', 'u1', data)

      expect(api.patch).toHaveBeenCalledWith('/companies/1/members/u1', data)
    })
  })

  describe('removeMember', () => {
    it('calls DELETE /companies/:id/members/:userId', async () => {
      vi.mocked(api.delete).mockResolvedValueOnce(undefined)

      await companyService.removeMember('1', 'u1')

      expect(api.delete).toHaveBeenCalledWith('/companies/1/members/u1')
    })
  })
})
