/** Dados do usuário autenticado retornados pelo serviço de auth. */
export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  /** Active company ID (tenant context) */
  projectId?: string;
  role?: string;
}

/** Company summary returned in auth status */
export interface AuthCompanySummary {
  id: string;
  name: string;
  role: string;
}

/** Resposta do Authify ao trocar authorization code por tokens (padrão OAuth 2.0). */
export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: AuthUser;
}
