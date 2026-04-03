/**
 * AuditLoggerService - Registra acoes do backend no MongoDB.
 * NAO lanca excecoes - logging nunca deve quebrar a aplicacao.
 */
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import {
  AuditLog,
  AuditLogDocument,
  AuditLogLevel,
  AuditLogEventType,
} from '../../database/schemas';
import { AuditLogParams, sanitizeObject, extractError } from './audit-logger.types';

@Injectable()
export class AuditLoggerService {
  private readonly logger = new Logger(AuditLoggerService.name);

  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditLogModel: Model<AuditLogDocument>,
  ) {}

  generateRequestId(): string {
    return uuidv4();
  }

  async log(params: AuditLogParams): Promise<AuditLogDocument | null> {
    try {
      const sanitizedParams = params.params ? sanitizeObject(params.params) : undefined;
      const sanitizedResult = params.result ? sanitizeObject(params.result) : undefined;

      return await this.auditLogModel.create({
        level: params.level || AuditLogLevel.INFO,
        eventType: params.eventType,
        requestId: params.requestId ?? undefined,
        userId: params.userId ?? undefined,
        userEmail: params.userEmail ?? undefined,
        method: params.method ?? undefined,
        path: params.path ?? undefined,
        statusCode: params.statusCode ?? undefined,
        service: params.service ?? undefined,
        methodName: params.methodName ?? undefined,
        message: params.message ?? undefined,
        params: sanitizedParams,
        result: sanitizedResult,
        errorMessage: params.errorMessage ?? undefined,
        errorStack: params.errorStack?.substring(0, 5000),
        errorCode: params.errorCode ?? undefined,
        durationMs: params.durationMs ?? undefined,
        ipAddress: params.ipAddress ?? undefined,
        userAgent: params.userAgent?.substring(0, 500),
        metadata: params.metadata ?? undefined,
      });
    } catch (error) {
      this.logger.error(`Failed to save audit log: ${(error as Error).message}`, (error as Error).stack);
      return null;
    }
  }

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

  async info(message: string, metadata?: Record<string, unknown>, requestId?: string): Promise<void> {
    await this.log({ level: AuditLogLevel.INFO, eventType: AuditLogEventType.SYSTEM_INFO, requestId, message, metadata });
  }

  async warn(message: string, metadata?: Record<string, unknown>, requestId?: string): Promise<void> {
    await this.log({ level: AuditLogLevel.WARN, eventType: AuditLogEventType.SYSTEM_WARNING, requestId, message, metadata });
  }

  async error(message: string, error?: Error | string, metadata?: Record<string, unknown>, requestId?: string): Promise<void> {
    const { errorMessage, errorStack } = extractError(error);
    await this.log({ level: AuditLogLevel.ERROR, eventType: AuditLogEventType.SYSTEM_ERROR, requestId, message, errorMessage, errorStack, metadata });
  }
}
