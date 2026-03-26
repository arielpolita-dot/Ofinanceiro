import { describe, it, expect, vi, beforeEach } from 'vitest'
import { adminService } from '../admin.service'
import { api } from '../api'

vi.mock('../api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('adminService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getStats', () => {
    it('calls GET /admin/stats', async () => {
      const mockStats = { totalUsers: 42 }
      vi.mocked(api.get).mockResolvedValueOnce(mockStats)

      const result = await adminService.getStats()

      expect(api.get).toHaveBeenCalledWith('/admin/stats')
      expect(result).toEqual(mockStats)
    })

    it('propagates errors', async () => {
      vi.mocked(api.get).mockRejectedValueOnce(new Error('Server error'))

      await expect(adminService.getStats()).rejects.toThrow('Server error')
    })
  })

  describe('getDashboard', () => {
    it('calls GET /admin/dashboard', async () => {
      const mockData = { stats: { totalUsers: 10 } }
      vi.mocked(api.get).mockResolvedValueOnce(mockData)

      const result = await adminService.getDashboard()

      expect(api.get).toHaveBeenCalledWith('/admin/dashboard')
      expect(result).toEqual(mockData)
    })

    it('propagates errors', async () => {
      vi.mocked(api.get).mockRejectedValueOnce(new Error('Forbidden'))

      await expect(adminService.getDashboard()).rejects.toThrow('Forbidden')
    })
  })
})
