/**
 * ==============================================================================
 * AuthBffGuard - Guard de Autenticação para Rotas Protegidas
 * ==============================================================================
 *
 * Guard NestJS que protege rotas exigindo autenticação válida.
 * Valida access_token e anexa dados do usuário à requisição.
 *
 * ## Como Usar
 *
 * ```typescript
 * // Em um controller
 * @UseGuards(AuthBffGuard)
 * @Get('profile')
 * async getProfile(@Req() req: Request) {
 *   const user = req.user; // Dados do usuário autenticado
 *   return { user };
 * }
 *
 * // Em um módulo (proteção global)
 * @Module({
 *   providers: [
 *     { provide: APP_GUARD, useClass: AuthBffGuard }
 *   ]
 * })
 * ```
 *
 * ## Fluxo de Validação
 *
 * ```
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                    GUARD VALIDATION FLOW                        │
 * ├─────────────────────────────────────────────────────────────────┤
 * │                                                                 │
 * │  ┌──────────┐     ┌──────────┐     ┌──────────┐               │
 * │  │ Request  │────▶│ Guard    │────▶│ Authify  │               │
 * │  │          │     │          │     │ /profile │               │
 * │  └──────────┘     └──────────┘     └──────────┘               │
 * │       │                │                │                      │
 * │       │  Authorization │                │                      │
 * │       │  Bearer xxx    │  Validate      │                      │
 * │       │───────────────▶│───────────────▶│                      │
 * │       │                │                │                      │
 * │       │                │  User data     │                      │
 * │       │                │◀───────────────│                      │
 * │       │                │                │                      │
 * │       │  req.user =    │                │                      │
 * │       │  userData      │                │                      │
 * │       │◀───────────────│                │                      │
 * │       │                │                │                      │
 * │       │  Continue to   │                │                      │
 * │       │  Controller    │                │                      │
 * │       │───────────────▶                 │                      │
 * │                                                                 │
 * └─────────────────────────────────────────────────────────────────┘
 * ```
 *
 * ## Respostas de Erro
 *
 * | Situação                  | Status | Mensagem                    |
 * |---------------------------|--------|-----------------------------|
 * | Sem header Authorization  | 401    | "Authentication required"   |
 * | Token inválido/expirado   | 401    | "Invalid or expired token"  |
 *
 * @module auth-bff
 * @see {@link AuthBffService} para validação de token
 * @see {@link AuthBffController} para endpoints de auth
 */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { extractToken } from '../../common/utils/extract-token.util';
import { AuthBffService, AuthUser } from './auth-bff.service';

/**
 * =========================================================================
 * Extensão do Express Request
 * =========================================================================
 *
 * Adiciona propriedade `user` ao Request do Express para TypeScript.
 * Permite acessar `req.user` em controllers após validação do guard.
 */
declare global {
  namespace Express {
    interface Request {
      /** Dados do usuário autenticado (preenchido pelo AuthBffGuard) */
      user?: AuthUser;
    }
  }
}

/**
 * =========================================================================
 * AuthBffGuard - Guard Principal de Autenticação
 * =========================================================================
 *
 * Implementa CanActivate para proteção de rotas no NestJS.
 * Extrai token do header Authorization e valida com Authify.
 *
 * @class AuthBffGuard
 * @implements {CanActivate}
 */
@Injectable()
export class AuthBffGuard implements CanActivate {
  constructor(private readonly authBffService: AuthBffService) {}

  /**
   * =========================================================================
   * canActivate - Método Principal de Validação
   * =========================================================================
   *
   * Valida se a requisição possui token de acesso válido.
   *
   * ## Processo de Validação
   *
   * 1. Extrai token do header `Authorization: Bearer xxx`
   * 2. Valida token chamando Authify /auth/profile
   * 3. Se válido, anexa user à requisição e retorna true
   * 4. Se inválido, lança UnauthorizedException
   *
   * ## Nota sobre Refresh
   *
   * Se o token estiver expirado, este guard NÃO tenta renovar automaticamente.
   * O frontend deve:
   * 1. Detectar erro 401
   * 2. Chamar POST /api/auth/refresh
   * 3. Repetir a requisição original
   *
   * @param {ExecutionContext} context - Contexto de execução do NestJS
   * @returns {Promise<boolean>} true se autenticado
   * @throws {UnauthorizedException} Se não autenticado ou token inválido
   *
   * @example
   * ```typescript
   * // O guard é usado automaticamente via decorator
   * @UseGuards(AuthBffGuard)
   * @Get('protected')
   * async protectedRoute(@Req() req: Request) {
   *   // req.user está disponível aqui
   *   return { userId: req.user.id };
   * }
   * ```
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const accessToken = extractToken(request);

    if (!accessToken) {
      throw new UnauthorizedException('Authentication required');
    }

    // Validate access token
    const user = await this.authBffService.validateAccessToken(accessToken);

    if (!user) {
      // Token might be expired, but we don't have user ID here to refresh
      // Frontend should handle refresh via /api/auth/refresh endpoint
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Attach user to request for use in controllers
    request.user = user;

    return true;
  }
}
