/**
 * ==============================================================================
 * AdminSession Entity - Sessão de Usuário
 * ==============================================================================
 *
 * Armazena sessões ativas de refresh tokens para autenticação JWT.
 * Permite logout seletivo e rastreamento de dispositivos/IPs.
 *
 * ## Tabela: `app_sessions`
 *
 * ## Campos Principais
 *
 * | Campo        | Tipo      | Descrição                              |
 * |--------------|-----------|----------------------------------------|
 * | id           | UUID      | ID único da sessão                     |
 * | adminUserId  | UUID      | FK para AdminUser                      |
 * | refreshToken | VARCHAR   | Refresh token (hashed ou plain)        |
 * | ipAddress    | VARCHAR   | IP do cliente (rastreamento)           |
 * | userAgent    | VARCHAR   | User-Agent do navegador                |
 * | expiresAt    | TIMESTAMP | Data de expiração do token             |
 * | active       | BOOLEAN   | Se a sessão está ativa (logout=false)  |
 *
 * ## Fluxo de Sessão
 *
 * ```
 * Login                    Refresh                   Logout
 *   │                         │                         │
 *   ▼                         ▼                         ▼
 * ┌─────────────┐       ┌─────────────┐          ┌─────────────┐
 * │ CREATE      │       │ VALIDATE    │          │ SET active  │
 * │ new session │──────▶│ refreshToken│─────────▶│ = false     │
 * │ active=true │       │ + expiresAt │          │             │
 * └─────────────┘       └─────────────┘          └─────────────┘
 * ```
 *
 * ## Índices
 *
 * - `@Index(['refreshToken'])` - Busca rápida por token
 *
 * @module database/entities
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { AdminUser } from './admin-user.entity';

/**
 * Entidade de sessão de administrador.
 * @table app_sessions
 */
@Entity('app_sessions')
@Index(['refreshToken'])
export class AdminSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'admin_user_id' })
  adminUserId!: string;

  @ManyToOne(() => AdminUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'admin_user_id' })
  adminUser!: AdminUser;

  @Column({ name: 'refresh_token' })
  refreshToken!: string;

  @Column({ name: 'ip_address', type: 'varchar', nullable: true })
  ipAddress!: string;

  @Column({ name: 'user_agent', type: 'varchar', nullable: true })
  userAgent!: string;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt!: Date;

  @Column({ default: true })
  active!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
