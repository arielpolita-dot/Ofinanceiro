import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ApiError } from '../api'

// We need to re-import api after mocking import.meta.env
// The module uses import.meta.env at load time, so we test via the class behavior

describe('ApiError', () => {
  it('creates error with status', () => {
    const err = new ApiError('Not found', 404)
    expect(err.message).toBe('Not found')
    expect(err.status).toBe(404)
    expect(err.name).toBe('ApiError')
    expect(err.code).toBeUndefined()
    expect(err.checkoutUrl).toBeUndefined()
  })

  it('creates error with code and checkoutUrl', () => {
    const err = new ApiError('No credits', 403, 'INSUFFICIENT_CREDITS', 'https://checkout.stripe.com/xyz')
    expect(err.status).toBe(403)
    expect(err.code).toBe('INSUFFICIENT_CREDITS')
    expect(err.checkoutUrl).toBe('https://checkout.stripe.com/xyz')
  })

  it('is instance of Error', () => {
    const err = new ApiError('test', 500)
    expect(err).toBeInstanceOf(Error)
  })
})

describe('ApiClient (via api export)', () => {
  const originalFetch = globalThis.fetch
  const originalLocation = window.location

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
    // Mock localStorage
    vi.spyOn(Storage.prototype, 'removeItem')
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: { href: '', pathname: '/' },
      writable: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    globalThis.fetch = originalFetch
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    })
  })

  // Dynamic import to get fresh module with mocked env
  async function getApi() {
    // Clear module cache
    const mod = await import('../api')
    return mod.api
  }

  it('sends GET request with credentials', async () => {
    const mockResponse = { id: 1, name: 'Test' }
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(mockResponse), { status: 200 }),
    )

    const api = await getApi()
    const result = await api.get('/users/1')

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/users/1'),
      expect.objectContaining({
        method: 'GET',
        credentials: 'include',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      }),
    )
    expect(result).toEqual(mockResponse)
  })

  it('sends POST request with JSON body', async () => {
    const mockResponse = { id: 2 }
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(mockResponse), { status: 201 }),
    )

    const api = await getApi()
    await api.post('/users', { name: 'New' })

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/users'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'New' }),
      }),
    )
  })

  it('sends PUT request', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    )

    const api = await getApi()
    await api.put('/users/1', { name: 'Updated' })

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/users/1'),
      expect.objectContaining({ method: 'PUT' }),
    )
  })

  it('sends PATCH request', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    )

    const api = await getApi()
    await api.patch('/users/1', { name: 'Patched' })

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/users/1'),
      expect.objectContaining({ method: 'PATCH' }),
    )
  })

  it('sends DELETE request', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(null, { status: 204 }),
    )

    const api = await getApi()
    const result = await api.delete('/users/1')

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/users/1'),
      expect.objectContaining({ method: 'DELETE' }),
    )
    expect(result).toBeUndefined()
  })

  it('handles 204 No Content response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(null, { status: 204 }),
    )

    const api = await getApi()
    const result = await api.get('/resource')
    expect(result).toBeUndefined()
  })

  it('handles empty text response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response('', { status: 200 }),
    )

    const api = await getApi()
    const result = await api.get('/resource')
    expect(result).toBeUndefined()
  })

  it('redirects to login on 401', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 }),
    )

    const api = await getApi()
    await expect(api.get('/protected')).rejects.toThrow('Unauthorized')
    expect(localStorage.removeItem).toHaveBeenCalled()
  })

  it('throws ApiError with code on non-ok response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({ message: 'No credits', code: 'INSUFFICIENT_CREDITS', checkoutUrl: 'https://stripe.com/x' }),
        { status: 403 },
      ),
    )

    const api = await getApi()
    try {
      await api.get('/scan')
      expect.fail('Should have thrown')
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError)
      const apiErr = err as ApiError
      expect(apiErr.status).toBe(403)
      expect(apiErr.code).toBe('INSUFFICIENT_CREDITS')
      expect(apiErr.checkoutUrl).toBe('https://stripe.com/x')
    }
  })

  it('handles non-JSON error response gracefully', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response('Internal Server Error', {
        status: 500,
        headers: { 'Content-Type': 'text/plain' },
      }),
    )

    const api = await getApi()
    await expect(api.get('/broken')).rejects.toThrow('Request failed')
  })

  it('sends POST without body when data is undefined', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    )

    const api = await getApi()
    await api.post('/endpoint')

    expect(fetch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ body: undefined }),
    )
  })
})
