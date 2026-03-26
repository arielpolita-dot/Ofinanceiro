/**
 * ==============================================================================
 * CustomThrottlerGuard - Guard de Rate Limiting Customizado
 * ==============================================================================
 *
 * Extensão do ThrottlerGuard padrão do NestJS com funcionalidades adicionais:
 *
 * 1. **Identificação Inteligente**: Usa user ID quando autenticado, IP quando não
 * 2. **Mensagens em Português**: Erros amigáveis para usuários brasileiros
 * 3. **Proteção Adaptativa**: Limites diferentes baseados no contexto
 *
 * ## Como Funciona
 *
 * ```
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                    RATE LIMITING FLOW                           │
 * ├─────────────────────────────────────────────────────────────────┤
 * │                                                                 │
 * │  Request → CustomThrottlerGuard                                 │
 * │                ↓                                                │
 * │         getTracker()                                            │
 * │                ↓                                                │
 * │    ┌───────────────────────┐                                    │
 * │    │ User autenticado?     │                                    │
 * │    └───────────────────────┘                                    │
 * │           │          │                                          │
 * │          SIM        NÃO                                         │
 * │           ↓          ↓                                          │
 * │      user.id      req.ip                                        │
 * │           │          │                                          │
 * │           └────┬─────┘                                          │
 * │                ↓                                                │
 * │         Check limits                                            │
 * │                ↓                                                │
 * │    ┌───────────────────────┐                                    │
 * │    │ Limite excedido?      │                                    │
 * │    └───────────────────────┘                                    │
 * │           │          │                                          │
 * │          SIM        NÃO                                         │
 * │           ↓          ↓                                          │
 * │   ThrottlerException  ✓ Permite                                 │
 * │                                                                 │
 * └─────────────────────────────────────────────────────────────────┘
 * ```
 *
 * ## Vantagens
 *
 * - **Por User ID**: Evita bloquear múltiplos usuários atrás do mesmo IP (NAT)
 * - **Por IP**: Protege contra ataques de força bruta em endpoints públicos
 * - **Flexível**: Pode ser customizado por endpoint via decorators
 *
 * @module common/guards
 * @see {@link ThrottlerGuard} do @nestjs/throttler
 */
import { Injectable, ExecutionContext } from '@nestjs/common';
import {
  ThrottlerGuard,
  ThrottlerException,
  ThrottlerLimitDetail,
} from '@nestjs/throttler';

/**
 * =========================================================================
 * CustomThrottlerGuard - Guard Principal de Rate Limiting
 * =========================================================================
 *
 * Guard customizado que estende o ThrottlerGuard do NestJS para:
 * - Usar identificação inteligente (user ID ou IP)
 * - Mensagens de erro em português
 *
 * @class CustomThrottlerGuard
 * @extends {ThrottlerGuard}
 */
@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  /**
   * =========================================================================
   * getTracker - Identificação do Cliente para Rate Limiting
   * =========================================================================
   *
   * Determina qual identificador usar para rastrear o cliente:
   * - Se autenticado: usa o user.id (mais preciso)
   * - Se não autenticado: usa o IP (fallback)
   *
   * Isso evita que múltiplos usuários em uma rede corporativa (mesmo IP)
   * sejam bloqueados quando apenas um está fazendo muitas requisições.
   *
   * @param {Record<string, any>} req - Request object
   * @returns {Promise<string>} Identificador único do cliente
   * @protected
   */
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Usar user ID se autenticado, senão IP
    return req.user?.id || req.ip || 'unknown';
  }

  /**
   * =========================================================================
   * throwThrottlingException - Exceção de Rate Limit Customizada
   * =========================================================================
   *
   * Lança exceção com mensagem amigável em português quando o limite
   * de requisições é excedido.
   *
   * @param {ExecutionContext} _context - Contexto de execução (não usado)
   * @param {ThrottlerLimitDetail} _throttlerLimitDetail - Detalhes do limite (não usado)
   * @throws {ThrottlerException} Sempre, com mensagem em português
   * @protected
   */
  protected async throwThrottlingException(
    _context: ExecutionContext,
    _throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    throw new ThrottlerException(
      'Muitas requisições. Aguarde um momento antes de tentar novamente.',
    );
  }

  /**
   * =========================================================================
   * getErrorMessage - Mensagem de Erro Customizada
   * =========================================================================
   *
   * Retorna mensagem de erro em português para o usuário.
   *
   * @param {ExecutionContext} _context - Contexto de execução (não usado)
   * @param {ThrottlerLimitDetail} _throttlerLimitDetail - Detalhes do limite (não usado)
   * @returns {Promise<string>} Mensagem de erro em português
   * @protected
   */
  protected async getErrorMessage(
    _context: ExecutionContext,
    _throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<string> {
    return 'Muitas requisições. Aguarde um momento antes de tentar novamente.';
  }
}
