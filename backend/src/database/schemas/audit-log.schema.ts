import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AuditLogDocument = HydratedDocument<AuditLog>;

export enum AuditLogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export enum AuditLogEventType {
  REQUEST_START = 'request_start',
  REQUEST_END = 'request_end',
  REQUEST_ERROR = 'request_error',
  METHOD_START = 'method_start',
  METHOD_END = 'method_end',
  METHOD_ERROR = 'method_error',
  AUTH_LOGIN = 'auth_login',
  AUTH_LOGOUT = 'auth_logout',
  AUTH_FAILED = 'auth_failed',
  AUTH_TOKEN_REFRESH = 'auth_token_refresh',
  DB_QUERY = 'db_query',
  DB_ERROR = 'db_error',
  EXTERNAL_CALL = 'external_call',
  EXTERNAL_RESPONSE = 'external_response',
  EXTERNAL_ERROR = 'external_error',
  SCAN_START = 'scan_start',
  SCAN_PROGRESS = 'scan_progress',
  SCAN_COMPLETE = 'scan_complete',
  SCAN_ERROR = 'scan_error',
  SYSTEM_ERROR = 'system_error',
  SYSTEM_WARNING = 'system_warning',
  SYSTEM_INFO = 'system_info',
}

@Schema({ collection: 'audit_logs', timestamps: { createdAt: 'created_at', updatedAt: false } })
export class AuditLog {
  @Prop({ default: AuditLogLevel.INFO, index: true })
  level!: AuditLogLevel;

  @Prop({ required: true, index: true })
  eventType!: AuditLogEventType;

  @Prop({ index: true })
  requestId?: string;

  @Prop({ index: true })
  userId?: string;

  @Prop()
  userEmail?: string;

  @Prop()
  method?: string;

  @Prop()
  path?: string;

  @Prop()
  statusCode?: number;

  @Prop({ index: true })
  service?: string;

  @Prop()
  methodName?: string;

  @Prop()
  message?: string;

  @Prop({ type: Object })
  params?: Record<string, unknown>;

  @Prop({ type: Object })
  result?: Record<string, unknown>;

  @Prop()
  errorMessage?: string;

  @Prop()
  errorStack?: string;

  @Prop()
  errorCode?: string;

  @Prop()
  durationMs?: number;

  @Prop()
  ipAddress?: string;

  @Prop()
  userAgent?: string;

  @Prop({ type: Object })
  metadata?: Record<string, unknown>;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

AuditLogSchema.index({ level: 1, created_at: 1 });
AuditLogSchema.index({ eventType: 1, created_at: 1 });
AuditLogSchema.index({ userId: 1, created_at: 1 });
AuditLogSchema.index({ service: 1, methodName: 1 });
AuditLogSchema.index({ created_at: 1 });
