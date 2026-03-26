/**
 * ==============================================================================
 * AuditLoggerInterceptor - Interceptor Global de Logging
 * ==============================================================================
 *
 * Intercepta TODAS as requisicoes HTTP e registra no audit log:
 * - Inicio da requisicao (metodo, path, params, user)
 * - Fim da requisicao (status, duracao, resultado resumido)
 * - Erros (excecoes, stack traces)
 *
 * @module common/audit-logger
 */
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Response } from 'express';
import { AuditLoggerService } from './audit-logger.service';

// Interface para Request com campos customizados
interface AuditRequest {
  requestId?: string;
  user?: { id: string; email: string };
  method: string;
  path: string;
  originalUrl: string;
  query: Record<string, unknown>;
  body: Record<string, unknown>;
  params: Record<string, unknown>;
  ip: string;
  socket?: { remoteAddress?: string };
  headers: Record<string, string | string[] | undefined>;
}

@Injectable()
export class AuditLoggerInterceptor implements NestInterceptor {
  constructor(private readonly auditLogger: AuditLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<AuditRequest>();
    const response = ctx.getResponse<Response>();

    // Gera ID unico para correlacionar logs desta requisicao
    const requestId = this.auditLogger.generateRequestId();
    request.requestId = requestId;

    const startTime = Date.now();
    const { method, path, originalUrl } = request;
    const user = request.user;

    // Extrai parametros da requisicao
    const params = this.extractParams(request);

    // Log de inicio da requisicao (async, nao bloqueia)
    const userAgentHeader = request.headers['user-agent'];
    const userAgent = Array.isArray(userAgentHeader) ? userAgentHeader[0] : userAgentHeader;

    this.auditLogger.logRequestStart({
      requestId,
      method,
      path: originalUrl || path,
      userId: user?.id || null,
      userEmail: user?.email || null,
      ipAddress: this.getClientIp(request),
      userAgent,
      params,
    });

    return next.handle().pipe(
      tap((responseBody) => {
        const durationMs = Date.now() - startTime;
        const statusCode = response.statusCode;

        // Log de fim da requisicao (sucesso)
        this.auditLogger.logRequestEnd({
          requestId,
          method,
          path: originalUrl || path,
          statusCode,
          durationMs,
          userId: user?.id || null,
          result: this.summarizeResult(responseBody),
        });
      }),
      catchError((error) => {
        const durationMs = Date.now() - startTime;
        const statusCode = error.status || error.statusCode || 500;

        // Log de erro
        this.auditLogger.logRequestError({
          requestId,
          method,
          path: originalUrl || path,
          statusCode,
          durationMs,
          userId: user?.id || null,
          error,
          errorCode: error.code || error.name,
        });

        // Re-lanca o erro para o handler de excecoes
        throw error;
      }),
    );
  }

  /**
   * Extrai parametros da requisicao (query, body, params)
   */
  private extractParams(request: AuditRequest): Record<string, unknown> | null {
    const params: Record<string, unknown> = {};

    // Query params
    if (request.query && Object.keys(request.query).length > 0) {
      params.query = request.query;
    }

    // Body (POST, PUT, PATCH)
    if (request.body && Object.keys(request.body).length > 0) {
      params.body = request.body;
    }

    // Route params
    if (request.params && Object.keys(request.params).length > 0) {
      params.params = request.params;
    }

    return Object.keys(params).length > 0 ? params : null;
  }

  /**
   * Resume o resultado para nao logar dados grandes
   */
  private summarizeResult(
    result: unknown,
  ): Record<string, unknown> | null {
    if (!result) return null;

    // Se for objeto com data (paginacao)
    if (typeof result === 'object' && 'data' in result) {
      const data = (result as Record<string, unknown>).data;
      return {
        hasData: true,
        count: Array.isArray(data) ? data.length : 1,
        ...(typeof result === 'object' && 'meta' in result
          ? { meta: (result as Record<string, unknown>).meta }
          : {}),
      };
    }

    // Se for array
    if (Array.isArray(result)) {
      return { count: result.length };
    }

    // Se for objeto simples
    if (typeof result === 'object') {
      const obj = result as Record<string, unknown>;
      // Retorna apenas campos nao-sensiveis de primeiro nivel
      const summary: Record<string, unknown> = {};
      for (const key of Object.keys(obj).slice(0, 10)) {
        const value = obj[key];
        if (typeof value !== 'object' || value === null) {
          summary[key] = value;
        } else if (Array.isArray(value)) {
          summary[key] = `[Array(${value.length})]`;
        } else {
          summary[key] = '[Object]';
        }
      }
      return summary;
    }

    return { value: String(result).substring(0, 100) };
  }

  /**
   * Obtem o IP real do cliente (considera proxies)
   */
  private getClientIp(request: AuditRequest): string | null {
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) {
      const ips = Array.isArray(forwarded)
        ? forwarded[0]
        : forwarded.split(',')[0];
      return ips.trim();
    }
    return request.ip || request.socket?.remoteAddress || null;
  }
}
