/**
 * ==============================================================================
 * OptionalAuthGuard - Guard de Autenticacao Opcional
 * ==============================================================================
 *
 * Guard NestJS para rotas que funcionam com ou sem autenticacao.
 * Se o usuario estiver autenticado, anexa ao request.
 * Se nao estiver, permite acesso sem erro.
 *
 * @module common/guards
 */
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthBffService } from '../../modules/auth/auth-bff.service';
import { extractToken } from '../utils/extract-token.util';

/**
 * OptionalAuthGuard - Guard de Autenticacao Opcional
 *
 * Diferente do AuthGuard, este guard NAO lanca erro se o usuario
 * nao estiver autenticado. Apenas anexa o usuario ao request
 * se o token for valido.
 */
@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(private readonly authBffService: AuthBffService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const accessToken = extractToken(request);

    // Sem token = acesso anonimo permitido
    if (!accessToken) {
      return true;
    }

    try {
      const user = await this.authBffService.validateAccessToken(accessToken);

      if (user) {
        // Attach user to request
        request.user = user;
        request.adminUser = user;
      }
    } catch {
      // Token invalido = trata como anonimo (nao lanca erro)
    }

    // Sempre permite acesso
    return true;
  }
}
