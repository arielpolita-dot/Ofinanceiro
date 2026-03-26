/**
 * ==============================================================================
 * Throttle Decorators - Decorators Customizados de Rate Limiting
 * ==============================================================================
 *
 * Decorators para aplicar rate limiting específico em controllers e endpoints.
 * Cada decorator é otimizado para um tipo específico de operação.
 *
 * ## Decorators Disponíveis
 *
 * | Decorator       | Limite        | Uso                                    |
 * |-----------------|---------------|----------------------------------------|
 * | StrictThrottle  | 5/min         | Login, registro, reset de senha        |
 * | ApiThrottle     | 30/min        | Endpoints de API pública               |
 * | AuditThrottle   | 3/min         | Operações custosas (auditorias)        |
 * | SkipThrottle    | -             | Desabilita throttle para o endpoint    |
 *
 * ## Exemplo de Uso
 *
 * ```typescript
 * import { StrictThrottle, AuditThrottle, SkipThrottle } from './common/decorators/throttle.decorator';
 *
 * @Controller('auth')
 * export class AuthController {
 *
 *   @Post('login')
 *   @StrictThrottle() // 5 requests por minuto
 *   async login() { ... }
 *
 *   @Get('status')
 *   @SkipThrottle() // Sem limite
 *   async status() { ... }
 * }
 *
 * @Controller('audits')
 * export class AuditsController {
 *
 *   @Post('start')
 *   @AuditThrottle() // 3 requests por minuto
 *   async startAudit() { ... }
 * }
 * ```
 *
 * ## Funcionamento
 *
 * Os decorators sobrescrevem a configuração global do ThrottlerModule
 * para endpoints específicos. Isso permite:
 *
 * - **Proteção granular**: Diferentes limites para diferentes operações
 * - **Flexibilidade**: Adaptar limites ao custo computacional da operação
 * - **Segurança**: Limites mais restritos em endpoints sensíveis
 *
 * @module common/decorators
 * @see {@link CustomThrottlerGuard} para implementação do rate limiting
 */
import { Throttle, SkipThrottle } from '@nestjs/throttler';

/**
 * =========================================================================
 * StrictThrottle - Para Endpoints Sensíveis
 * =========================================================================
 *
 * Aplica limite rigoroso de 5 requests por minuto.
 * Ideal para operações de autenticação e segurança.
 *
 * ## Endpoints Recomendados
 *
 * - POST /auth/login
 * - POST /auth/register
 * - POST /auth/forgot-password
 * - POST /auth/reset-password
 * - POST /auth/verify-email
 *
 * ## Por que 5/min?
 *
 * - Previne ataques de força bruta
 * - Permite tentativas legítimas de erro de digitação
 * - Balanceia segurança com usabilidade
 *
 * @returns {MethodDecorator & ClassDecorator} Decorator para aplicar o throttle
 *
 * @example
 * ```typescript
 * @Post('login')
 * @StrictThrottle()
 * async login(@Body() dto: LoginDto) {
 *   return this.authService.login(dto);
 * }
 * ```
 */
export const StrictThrottle = () =>
  Throttle({ default: { limit: 5, ttl: 60000 } });

/**
 * =========================================================================
 * ApiThrottle - Para Endpoints de API Pública
 * =========================================================================
 *
 * Aplica limite moderado de 30 requests por minuto.
 * Ideal para endpoints de API que precisam de mais throughput.
 *
 * ## Endpoints Recomendados
 *
 * - GET /api/projects
 * - GET /api/reports
 * - GET /api/users
 * - Qualquer endpoint de listagem ou busca
 *
 * ## Por que 30/min?
 *
 * - Permite uso normal de SPAs (várias chamadas por página)
 * - Protege contra scraping automatizado
 * - Suficiente para navegação fluida
 *
 * @returns {MethodDecorator & ClassDecorator} Decorator para aplicar o throttle
 *
 * @example
 * ```typescript
 * @Get('projects')
 * @ApiThrottle()
 * async listProjects() {
 *   return this.projectsService.findAll();
 * }
 * ```
 */
export const ApiThrottle = () =>
  Throttle({ default: { limit: 30, ttl: 60000 } });

/**
 * =========================================================================
 * AuditThrottle - Para Operações Custosas
 * =========================================================================
 *
 * Aplica limite restrito de 3 requests por minuto.
 * Ideal para operações que consomem recursos significativos.
 *
 * ## Endpoints Recomendados
 *
 * - POST /projects/:id/audit (iniciar auditoria)
 * - POST /reports/generate (gerar relatório PDF)
 * - POST /scans/full (scan completo de segurança)
 * - Qualquer operação que envolva processamento pesado
 *
 * ## Por que 3/min?
 *
 * - Auditorias consomem CPU/memória significativa
 * - Protege a infraestrutura contra sobrecarga
 * - Previne ataques de negação de serviço (DoS)
 * - Usuário legítimo raramente precisa mais que isso
 *
 * @returns {MethodDecorator & ClassDecorator} Decorator para aplicar o throttle
 *
 * @example
 * ```typescript
 * @Post('audit')
 * @AuditThrottle()
 * async startAudit(@Param('projectId') projectId: string) {
 *   return this.auditsService.startAudit(projectId);
 * }
 * ```
 */
export const AuditThrottle = () =>
  Throttle({ default: { limit: 3, ttl: 60000 } });

/**
 * Re-export do SkipThrottle do @nestjs/throttler
 *
 * Permite desabilitar completamente o rate limiting para endpoints específicos.
 * Use com cuidado - apenas para endpoints que realmente não precisam de proteção.
 *
 * ## Endpoints Recomendados
 *
 * - GET /health (health check)
 * - GET /api/auth/status (verificação rápida de autenticação)
 * - GET /api/public/info (informações públicas estáticas)
 *
 * @example
 * ```typescript
 * @Get('health')
 * @SkipThrottle()
 * async healthCheck() {
 *   return { status: 'ok' };
 * }
 * ```
 */
export { SkipThrottle };
