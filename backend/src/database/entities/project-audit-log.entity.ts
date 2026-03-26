/**
 * ==============================================================================
 * ProjectAuditLog - Log de Auditoria Completo do Backend
 * ==============================================================================
 *
 * Registra TODAS as acoes do backend para auditoria completa:
 * - Inicio de metodos
 * - Parametros recebidos
 * - Erros e excecoes
 * - Sucessos e resultados
 * - Tempo de execucao
 *
 * Tabela: app_audit_logs (no banco centralizado do dashboard)
 *
 * @module database/entities
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * Nivel do log
 */
export enum AuditLogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

/**
 * Tipo de evento
 */
export enum AuditLogEventType {
  // Ciclo de vida da requisicao
  REQUEST_START = 'request_start',
  REQUEST_END = 'request_end',
  REQUEST_ERROR = 'request_error',

  // Metodos/Servicos
  METHOD_START = 'method_start',
  METHOD_END = 'method_end',
  METHOD_ERROR = 'method_error',

  // Autenticacao
  AUTH_LOGIN = 'auth_login',
  AUTH_LOGOUT = 'auth_logout',
  AUTH_FAILED = 'auth_failed',
  AUTH_TOKEN_REFRESH = 'auth_token_refresh',

  // Database
  DB_QUERY = 'db_query',
  DB_ERROR = 'db_error',

  // External Services
  EXTERNAL_CALL = 'external_call',
  EXTERNAL_RESPONSE = 'external_response',
  EXTERNAL_ERROR = 'external_error',

  // Scan
  SCAN_START = 'scan_start',
  SCAN_PROGRESS = 'scan_progress',
  SCAN_COMPLETE = 'scan_complete',
  SCAN_ERROR = 'scan_error',

  // Sistema
  SYSTEM_ERROR = 'system_error',
  SYSTEM_WARNING = 'system_warning',
  SYSTEM_INFO = 'system_info',
}

@Entity('app_audit_logs')
@Index(['createdAt'])
@Index(['level', 'createdAt'])
@Index(['eventType', 'createdAt'])
@Index(['userId', 'createdAt'])
@Index(['requestId'])
@Index(['service', 'method'])
export class ProjectAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Nivel do log
  @Column({ type: 'varchar', length: 10, default: AuditLogLevel.INFO })
  level!: AuditLogLevel;

  // Tipo do evento
  @Column({ name: 'event_type', type: 'varchar', length: 50 })
  eventType!: AuditLogEventType;

  // Identificador unico da requisicao (para correlacionar logs)
  @Column({ name: 'request_id', type: 'uuid', nullable: true })
  requestId!: string | null;

  // Usuario (se autenticado)
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId!: string | null;

  @Column({ name: 'user_email', type: 'varchar', length: 255, nullable: true })
  userEmail!: string | null;

  // Contexto HTTP
  @Column({ type: 'varchar', length: 10, nullable: true })
  method!: string | null; // GET, POST, etc

  @Column({ type: 'varchar', length: 500, nullable: true })
  path!: string | null; // /api/projects

  @Column({ name: 'status_code', type: 'integer', nullable: true })
  statusCode!: number | null;

  // Servico/Classe e Metodo
  @Column({ type: 'varchar', length: 100, nullable: true })
  service!: string | null; // ProjectService, ScanService

  @Column({ name: 'method_name', type: 'varchar', length: 100, nullable: true })
  methodName!: string | null; // createProject, startScan

  // Mensagem descritiva
  @Column({ type: 'text', nullable: true })
  message!: string | null;

  // Parametros de entrada (sanitizados - sem senhas)
  @Column({ type: 'jsonb', nullable: true })
  params!: Record<string, unknown> | null;

  // Resultado/Resposta (resumido)
  @Column({ type: 'jsonb', nullable: true })
  result!: Record<string, unknown> | null;

  // Erro (se houver)
  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage!: string | null;

  @Column({ name: 'error_stack', type: 'text', nullable: true })
  errorStack!: string | null;

  @Column({ name: 'error_code', type: 'varchar', length: 50, nullable: true })
  errorCode!: string | null;

  // Performance
  @Column({ name: 'duration_ms', type: 'integer', nullable: true })
  durationMs!: number | null;

  // Contexto adicional
  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress!: string | null;

  @Column({ name: 'user_agent', type: 'varchar', length: 500, nullable: true })
  userAgent!: string | null;

  // Metadados extras
  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;
}
