/**
 * ==============================================================================
 * AuthGuard - Guard de Autenticação Principal
 * ==============================================================================
 *
 * Guard NestJS para proteção de rotas autenticadas.
 * Suporta múltiplas fontes de token com prioridade para segurança.
 *
 * ## Fontes de Token (em ordem de prioridade)
 *
 * ```
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │                     EXTRAÇÃO DE TOKEN                                   │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │                                                                         │
 * │  1. Cookie httpOnly (PRIORIDADE - mais seguro)                         │
 * │     ┌─────────────────────────────────────────────────────────────┐    │
 * │     │ Cookie: app_access_token=eyJhbG...                          │    │
 * │     └─────────────────────────────────────────────────────────────┘    │
 * │     ✓ Protegido contra XSS (não acessível via JavaScript)              │
 * │                                                                         │
 * │  2. Authorization Header (FALLBACK - compatibilidade)                  │
 * │     ┌─────────────────────────────────────────────────────────────┐    │
 * │     │ Authorization: Bearer eyJhbG...                             │    │
 * │     └─────────────────────────────────────────────────────────────┘    │
 * │     ⚠️ Vulnerável a XSS se token armazenado em localStorage            │
 * │                                                                         │
 * └─────────────────────────────────────────────────────────────────────────┘
 * ```
 *
 * ## Fluxo de Validação
 *
 * ```
 * ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
 * │ Try Cookie   │────▶│ Try Bearer   │────▶│ Validate     │
 * │              │     │ (fallback)   │     │ with Authify │
 * └──────────────┘     └──────────────┘     └──────┬───────┘
 *                                                  │
 *                      ┌──────────────┐           │
 *                      │ Attach User  │◀──────────┘
 *                      │ to Request   │
 *                      └──────────────┘
 * ```
 *
 * @module common/guards
 * @see {@link AuthGuard} para autenticação apenas via Bearer
 * @see {@link AuthBffService} para validação de tokens
 */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthBffService } from '../../modules/auth/auth-bff.service';
import { extractToken, getTokenSource } from '../utils/extract-token.util';
import { maskToken } from '../utils/mask-token.util';

/**
 * =========================================================================
 * AuthGuard - Guard de Autenticação Principal
 * =========================================================================
 *
 * Valida tokens de cookies httpOnly ou Bearer header.
 * Prioriza cookies por maior segurança contra XSS.
 *
 * @class AuthGuard
 * @implements {CanActivate}
 */
@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(private readonly authBffService: AuthBffService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.originalUrl || request.url;
    const origin = request.headers.origin || 'no-origin';

    const accessToken = extractToken(request);
    const source = getTokenSource(request);

    if (!accessToken) {
      const cookieKeys = request.cookies ? Object.keys(request.cookies) : [];
      this.logger.warn(
        `[AUTH-GUARD] NO TOKEN | ${method} ${url} | origin=${origin} | cookies=[${cookieKeys.join(',')}] | cookie-header=${request.headers.cookie ? 'present(' + request.headers.cookie.length + ' chars)' : 'MISSING'} | auth-header=${request.headers.authorization ? 'present' : 'MISSING'}`,
      );
      throw new UnauthorizedException('Authentication required');
    }
    this.logger.log(
      `[AUTH-GUARD] TOKEN FOUND | ${method} ${url} | source=${source} | token=${maskToken(accessToken)} | origin=${origin}`,
    );

    try {
      const user = await this.authBffService.validateAccessToken(accessToken);

      if (!user) {
        this.logger.warn(
          `[AUTH-GUARD] TOKEN INVALID | ${method} ${url} | source=${source} | token=${maskToken(accessToken)}`,
        );
        throw new UnauthorizedException('Invalid or expired token');
      }

      request.user = user;
      request.adminUser = user;

      this.logger.log(
        `[AUTH-GUARD] OK | ${method} ${url} | user=${user.email} (${user.id})`,
      );

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(
        `[AUTH-GUARD] ERROR | ${method} ${url} | ${error instanceof Error ? error.message : error}`,
      );
      throw new UnauthorizedException('Authentication failed');
    }
  }
}
