/**
 * AuditLoggerService - Registra ações do backend no banco centralizado.
 * NAO lança exceções - logging nunca deve quebrar a aplicação.
 */
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  ProjectAuditLog,
  AuditLogLevel,
  AuditLogEventType,
} from '../../database/entities/project-audit-log.entity';
import { AuditLogParams, sanitizeObject, extractError } from './audit-logger.types';

@Injectable()
export class AuditLoggerService {
  private readonly logger = new Logger(AuditLoggerService.name);

  constructor(
    @InjectRepository(ProjectAuditLog, 'audit')
    private readonly auditLogRepository: Repository<ProjectAuditLog>,
  ) {}

  /** Gera um novo request ID para correlacionar logs */
  generateRequestId(): string {
    return uuidv4();
  }

  /** Registra um log de auditoria. Nunca lança exceção. */
  async log(params: AuditLogParams): Promise<ProjectAuditLog | null> {
    try {
      const sanitizedParams = params.params ? sanitizeObject(params.params) : null;
      const sanitizedResult = params.result ? sanitizeObject(params.result) : null;

      const log = this.auditLogRepository.create({
        level: params.level || AuditLogLevel.INFO,
        eventType: params.eventType,
        requestId: params.requestId || null,
        userId: params.userId || null,
        userEmail: params.userEmail || null,
        method: params.method || null,
        path: params.path || null,
        statusCode: params.statusCode || null,
        service: params.service || null,
        methodName: params.methodName || null,
        message: params.message || null,
        params: sanitizedParams,
        result: sanitizedResult,
        errorMessage: params.errorMessage || null,
        errorStack: params.errorStack?.substring(0, 5000) || null,
        errorCode: params.errorCode || null,
        durationMs: params.durationMs || null,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent?.substring(0, 500) || null,
        metadata: params.metadata || null,
      });

      return await this.auditLogRepository.save(log);
    } catch (error) {
      this.logger.error(`Failed to save audit log: ${(error as Error).message}`, (error as Error).stack);
      return null;
    }
  }

  /** Log de início de requisição HTTP */
  async logRequestStart(params: {
    requestId: string; method: string; path: string;
    userId?: string | null; userEmail?: string | null;
    ipAddress?: string | null; userAgent?: string | null;
    params?: Record<string, unknown> | null;
  }): Promise<void> {
    await this.log({
      level: AuditLogLevel.INFO,
      eventType: AuditLogEventType.REQUEST_START,
      ...params,
      message: `${params.method} ${params.path}`,
    });
  }

  /** Log de fim de requisição HTTP (sucesso) */
  async logRequestEnd(params: {
    requestId: string; method: string; path: string;
    statusCode: number; durationMs: number;
    userId?: string | null; result?: Record<string, unknown> | null;
  }): Promise<void> {
    await this.log({
      level: AuditLogLevel.INFO,
      eventType: AuditLogEventType.REQUEST_END,
      ...params,
      message: `${params.method} ${params.path} -> ${params.statusCode} (${params.durationMs}ms)`,
    });
  }

  /** Log de erro em requisição HTTP */
  async logRequestError(params: {
    requestId: string; method: string; path: string;
    statusCode: number; durationMs: number;
    userId?: string | null; error: Error | string; errorCode?: string;
  }): Promise<void> {
    const { errorMessage, errorStack } = extractError(params.error);
    await this.log({
      level: AuditLogLevel.ERROR,
      eventType: AuditLogEventType.REQUEST_ERROR,
      requestId: params.requestId,
      method: params.method,
      path: params.path,
      statusCode: params.statusCode,
      durationMs: params.durationMs,
      userId: params.userId,
      errorMessage,
      errorStack,
      errorCode: params.errorCode,
      message: `${params.method} ${params.path} -> ERROR: ${errorMessage}`,
    });
  }

  /** Log de início de método/service */
  async logMethodStart(params: {
    requestId?: string | null; service: string; methodName: string;
    userId?: string | null; params?: Record<string, unknown> | null;
  }): Promise<void> {
    await this.log({
      level: AuditLogLevel.DEBUG,
      eventType: AuditLogEventType.METHOD_START,
      ...params,
      message: `${params.service}.${params.methodName}() started`,
    });
  }

  /** Log de fim de método/service (sucesso) */
  async logMethodEnd(params: {
    requestId?: string | null; service: string; methodName: string;
    userId?: string | null; durationMs?: number;
    result?: Record<string, unknown> | null;
  }): Promise<void> {
    await this.log({
      level: AuditLogLevel.DEBUG,
      eventType: AuditLogEventType.METHOD_END,
      ...params,
      message: `${params.service}.${params.methodName}() completed${params.durationMs ? ` (${params.durationMs}ms)` : ''}`,
    });
  }

  /** Log de erro em método/service */
  async logMethodError(params: {
    requestId?: string | null; service: string; methodName: string;
    userId?: string | null; durationMs?: number;
    error: Error | string; errorCode?: string;
    params?: Record<string, unknown> | null;
  }): Promise<void> {
    const { errorMessage, errorStack } = extractError(params.error);
    await this.log({
      level: AuditLogLevel.ERROR,
      eventType: AuditLogEventType.METHOD_ERROR,
      requestId: params.requestId,
      service: params.service,
      methodName: params.methodName,
      userId: params.userId,
      durationMs: params.durationMs,
      params: params.params,
      errorMessage,
      errorStack,
      errorCode: params.errorCode,
      message: `${params.service}.${params.methodName}() ERROR: ${errorMessage}`,
    });
  }

  /** Log de evento de autenticação */
  async logAuth(params: {
    eventType: AuditLogEventType.AUTH_LOGIN | AuditLogEventType.AUTH_LOGOUT
      | AuditLogEventType.AUTH_FAILED | AuditLogEventType.AUTH_TOKEN_REFRESH;
    requestId?: string | null; userId?: string | null;
    userEmail?: string | null; ipAddress?: string | null;
    userAgent?: string | null; message?: string;
    metadata?: Record<string, unknown> | null;
  }): Promise<void> {
    await this.log({
      level: params.eventType === AuditLogEventType.AUTH_FAILED ? AuditLogLevel.WARN : AuditLogLevel.INFO,
      ...params,
      message: params.message || params.eventType,
    });
  }

  /** Log de evento de scan */
  async logScan(params: {
    eventType: AuditLogEventType.SCAN_START | AuditLogEventType.SCAN_PROGRESS
      | AuditLogEventType.SCAN_COMPLETE | AuditLogEventType.SCAN_ERROR;
    requestId?: string | null; userId?: string | null;
    projectId?: string; reportId?: string; message?: string;
    durationMs?: number; error?: Error | string;
    metadata?: Record<string, unknown> | null;
  }): Promise<void> {
    const { errorMessage, errorStack } = extractError(params.error);
    await this.log({
      level: params.eventType === AuditLogEventType.SCAN_ERROR ? AuditLogLevel.ERROR : AuditLogLevel.INFO,
      eventType: params.eventType,
      requestId: params.requestId,
      userId: params.userId,
      message: params.message || params.eventType,
      durationMs: params.durationMs,
      errorMessage,
      errorStack,
      metadata: { ...params.metadata, projectId: params.projectId, reportId: params.reportId },
    });
  }

  /** Log de chamada externa (APIs, services) */
  async logExternalCall(params: {
    requestId?: string | null; service: string; endpoint: string;
    method?: string; durationMs?: number; statusCode?: number;
    success: boolean; error?: Error | string;
    metadata?: Record<string, unknown> | null;
  }): Promise<void> {
    const { errorMessage } = extractError(params.error);
    await this.log({
      level: params.success ? AuditLogLevel.INFO : AuditLogLevel.ERROR,
      eventType: params.success ? AuditLogEventType.EXTERNAL_RESPONSE : AuditLogEventType.EXTERNAL_ERROR,
      requestId: params.requestId,
      service: params.service,
      method: params.method || 'GET',
      path: params.endpoint,
      statusCode: params.statusCode,
      durationMs: params.durationMs,
      errorMessage,
      message: `External ${params.service}: ${params.method || 'GET'} ${params.endpoint} -> ${params.success ? 'OK' : 'ERROR'}`,
      metadata: params.metadata,
    });
  }

  /** Log genérico de info */
  async info(message: string, metadata?: Record<string, unknown>, requestId?: string): Promise<void> {
    await this.log({ level: AuditLogLevel.INFO, eventType: AuditLogEventType.SYSTEM_INFO, requestId, message, metadata });
  }

  /** Log genérico de warn */
  async warn(message: string, metadata?: Record<string, unknown>, requestId?: string): Promise<void> {
    await this.log({ level: AuditLogLevel.WARN, eventType: AuditLogEventType.SYSTEM_WARNING, requestId, message, metadata });
  }

  /** Log genérico de error */
  async error(message: string, error?: Error | string, metadata?: Record<string, unknown>, requestId?: string): Promise<void> {
    const { errorMessage, errorStack } = extractError(error);
    await this.log({ level: AuditLogLevel.ERROR, eventType: AuditLogEventType.SYSTEM_ERROR, requestId, message, errorMessage, errorStack, metadata });
  }
}
