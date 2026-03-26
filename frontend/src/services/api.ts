/**
 * ==============================================================================
 * API Client - Cliente HTTP Base
 * ==============================================================================
 *
 * Cliente HTTP centralizado para todas as requisições ao backend.
 * Usa httpOnly cookies para autenticação (proteção XSS).
 *
 * ## Configuração (Variáveis de Ambiente)
 *
 * | Variável            | Descrição                      |
 * |---------------------|--------------------------------|
 * | VITE_API_URL        | URL base da API                |
 * | VITE_STORAGE_PREFIX | Prefixo para localStorage      |
 *
 * ## Segurança
 *
 * ```
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                    AUTENTICAÇÃO HTTPONLY                        │
 * ├─────────────────────────────────────────────────────────────────┤
 * │                                                                 │
 * │  Browser                          Backend                       │
 * │  ───────                          ───────                       │
 * │  credentials: 'include' ─────────▶ Set-Cookie: httpOnly        │
 * │                                                                 │
 * │  ✓ Cookie enviado automaticamente                              │
 * │  ✓ JavaScript NÃO tem acesso ao token                          │
 * │  ✓ Proteção contra XSS                                         │
 * │                                                                 │
 * └─────────────────────────────────────────────────────────────────┘
 * ```
 *
 * ## Tratamento de Erros
 *
 * - 401 Unauthorized → Redirect para login
 * - 204 No Content → Retorna undefined
 * - Outros erros → Throw ApiError com status/code/checkoutUrl
 *
 * @module services
 */
const API_URL = import.meta.env.VITE_API_URL
const STORAGE_PREFIX = import.meta.env.VITE_STORAGE_PREFIX || 'app'

/**
 * Erro customizado com status HTTP e código de erro.
 *
 * @example
 * try {
 *   await api.get('/endpoint')
 * } catch (error) {
 *   if (error instanceof ApiError) {
 *     console.log(error.status)       // 403
 *     console.log(error.code)         // 'INSUFFICIENT_CREDITS'
 *     console.log(error.checkoutUrl)  // URL para compra
 *   }
 * }
 */
export class ApiError extends Error {
  status: number
  code?: string
  checkoutUrl?: string

  constructor(message: string, status: number, code?: string, checkoutUrl?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.checkoutUrl = checkoutUrl
  }
}

/**
 * Cliente HTTP com suporte a httpOnly cookies.
 *
 * ## Métodos Disponíveis
 *
 * | Método   | Descrição                          |
 * |----------|-------------------------------------|
 * | get()    | GET request                         |
 * | post()   | POST request com body JSON          |
 * | put()    | PUT request com body JSON           |
 * | patch()  | PATCH request com body JSON         |
 * | delete() | DELETE request                      |
 *
 * @example
 * // GET
 * const user = await api.get<User>('/auth/me')
 *
 * // POST
 * const data = await api.post<MyType>('/resource', { field: 'value' })
 */
class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    })

    if (response.status === 401) {
      localStorage.removeItem(`${STORAGE_PREFIX}_user`)
      window.location.href = `${this.baseUrl}/api/auth/login`
      throw new ApiError('Unauthorized', 401)
    }

    if (!response.ok) {
      await this.throwApiError(response)
    }

    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return undefined as unknown as T
    }

    const text = await response.text()
    if (!text) {
      return undefined as unknown as T
    }

    return JSON.parse(text) as T
  }

  private async throwApiError(response: Response): Promise<never> {
    const error = await response.json().catch(() => ({ message: 'Request failed' }))
    throw new ApiError(
      error.message || 'Request failed',
      response.status,
      error.code,
      error.checkoutUrl,
    )
  }

  get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  delete<T = void>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

export const api = new ApiClient(`${API_URL}/api`)
