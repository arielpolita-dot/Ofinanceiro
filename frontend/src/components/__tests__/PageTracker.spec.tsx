import { describe, it, expect, vi } from 'vitest'

vi.mock('react-router-dom', () => ({
  useLocation: vi.fn(() => ({ pathname: '/test', search: '', hash: '' })),
}))

describe('PageTracker', () => {
  it('exports PageTracker component', async () => {
    const mod = await import('../PageTracker')
    expect(mod.PageTracker).toBeDefined()
  })
})
