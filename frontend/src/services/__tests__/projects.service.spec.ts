import { describe, it, expect, vi } from 'vitest'

vi.mock('../api', () => ({
  api: { get: vi.fn().mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } }) },
}))

describe('projectsService', () => {
  it('getAll calls api.get', async () => {
    const { api } = await import('../api')
    const { projectsService } = await import('../projects.service')
    await projectsService.getAll()
    expect(api.get).toHaveBeenCalledWith('/projects?page=1&limit=10')
  })
  it('getAll with custom params', async () => {
    const { api } = await import('../api')
    const { projectsService } = await import('../projects.service')
    await projectsService.getAll(2, 20)
    expect(api.get).toHaveBeenCalledWith('/projects?page=2&limit=20')
  })
})
