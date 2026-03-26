/**
 * ==============================================================================
 * ActivityLog Entity - Log de Atividades
 * ==============================================================================
 *
 * Registra todas as acoes dos usuarios no sistema para auditoria e rastreabilidade.
 *
 * ## Tabela: `app_activity_logs`
 *
 * ## Campos Principais
 *
 * | Campo        | Tipo    | Descricao                        |
 * |--------------|---------|----------------------------------|
 * | id           | UUID    | ID unico                         |
 * | userId       | UUID    | Usuario que fez a acao           |
 * | action       | VARCHAR | Tipo de acao (login, etc.)       |
 * | resourceType | VARCHAR | Recurso afetado                  |
 * | resourceId   | UUID    | ID do recurso                    |
 * | metadata     | JSONB   | Detalhes (before/after)          |
 *
 * @module database/entities
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AdminUser } from './admin-user.entity';

/**
 * Acoes que podem ser registradas
 */
export enum ActivityAction {
  // Auth
  LOGIN = 'login',
  LOGIN_FAILED = 'login_failed',
  LOGOUT = 'logout',
  TOKEN_REFRESH = 'token_refresh',
  PASSWORD_RESET_REQUEST = 'password_reset_request',
  PASSWORD_RESET_COMPLETE = 'password_reset_complete',

  // User/Settings
  PROFILE_UPDATE = 'profile_update',
  NOTIFICATION_UPDATE = 'notification_update',

  // Navigation
  NAV_PAGE_VIEW = 'nav_page_view',
  NAV_CLICK = 'nav_click',

  // CTA (Call to Action)
  CTA_CLICK = 'cta_click',

  // Conversion
  CONVERSION_CHECKOUT_START = 'conversion_checkout_start',
  CONVERSION_CHECKOUT_COMPLETE = 'conversion_checkout_complete',

  // Billing
  BILLING_CHECKOUT_START = 'billing_checkout_start',
  BILLING_CHECKOUT_COMPLETE = 'billing_checkout_complete',

  // Errors
  ERROR_API = 'error_api',
  ERROR_VALIDATION = 'error_validation',
  ERROR_AUTH = 'error_auth',
  ERROR_PAYMENT = 'error_payment',
  ERROR_UNKNOWN = 'error_unknown',

  // System
  SYSTEM_ERROR = 'system_error',

  // Generic frontend event (catch-all)
  FRONTEND_EVENT = 'frontend_event',
}

/**
 * Tipos de recursos
 */
export enum ActivityResource {
  AUTH = 'auth',
  USER = 'user',
  SYSTEM = 'system',
  BILLING = 'billing',
  NAVIGATION = 'navigation',
  CTA = 'cta',
  FRONTEND = 'frontend',
}

/**
 * Metadados da atividade
 */
export interface ActivityMetadata {
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  changes?: string[];
  error?: string;
  details?: Record<string, unknown>;
}

/**
 * Entidade de log de atividades.
 * @table app_activity_logs
 */
@Entity('app_activity_logs')
@Index(['userId', 'createdAt'])
@Index(['action', 'createdAt'])
@Index(['resourceType', 'resourceId'])
@Index(['ipAddress'])
@Index(['createdAt'])
@Index(['companyId'])
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Quem fez
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId!: string | null;

  @ManyToOne(() => AdminUser, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user!: AdminUser;

  // Contexto multi-tenant (opcional)
  @Column({ name: 'company_id', type: 'uuid', nullable: true })
  companyId!: string | null;

  @Column({ name: 'user_email', type: 'varchar', length: 255, nullable: true })
  userEmail!: string | null;

  // O que fez
  @Column({ type: 'varchar', length: 50 })
  action!: ActivityAction;

  // Em qual recurso
  @Column({ name: 'resource_type', type: 'varchar', length: 50 })
  resourceType!: ActivityResource;

  @Column({ name: 'resource_id', type: 'uuid', nullable: true })
  resourceId!: string | null;

  @Column({ name: 'resource_name', type: 'varchar', length: 255, nullable: true })
  resourceName!: string | null;

  // Contexto
  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress!: string | null;

  @Column({ name: 'user_agent', type: 'varchar', length: 500, nullable: true })
  userAgent!: string | null;

  @Column({ name: 'session_id', type: 'uuid', nullable: true })
  sessionId!: string | null;

  // Detalhes da acao
  @Column({ type: 'jsonb', nullable: true })
  metadata!: ActivityMetadata | null;

  // Status
  @Column({ type: 'boolean', default: true })
  success!: boolean;

  @Column({ name: 'error_message', type: 'varchar', length: 500, nullable: true })
  errorMessage!: string | null;

  // Duracao (para operacoes longas)
  @Column({ name: 'duration_ms', type: 'integer', nullable: true })
  durationMs!: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;
}
