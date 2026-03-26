/**
 * ==============================================================================
 * AdminUser Entity - Usuário Administrativo
 * ==============================================================================
 *
 * Representa um usuário do sistema.
 * Suporta múltiplos providers de autenticação (email, Google, GitHub).
 *
 * ## Tabela: `app_users`
 *
 * ## Campos Principais
 *
 * | Campo          | Tipo    | Descrição                        |
 * |----------------|---------|----------------------------------|
 * | id             | UUID    | ID único                         |
 * | email          | VARCHAR | Email (único, indexado)          |
 * | passwordHash   | VARCHAR | Hash bcrypt da senha             |
 * | provider       | VARCHAR | Provider (email/google/github)   |
 * | emailVerified  | BOOLEAN | Se email foi verificado          |
 *
 * @module database/entities
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/** Providers de autenticação suportados */
export enum AuthProvider {
  EMAIL = 'email',
  GOOGLE = 'google',
  GITHUB = 'github',
}

/**
 * Entidade de usuário administrativo.
 * @table app_users
 */
@Entity('app_users')
@Index(['email'], { unique: true })
export class AdminUser {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  email!: string;

  @Column({ name: 'password_hash', type: 'varchar', nullable: true })
  passwordHash!: string;

  @Column({ type: 'varchar', nullable: true })
  name!: string;

  @Column({ type: 'varchar', nullable: true })
  avatar!: string;

  @Column({ name: 'email_verified', default: false })
  emailVerified!: boolean;

  @Column({ name: 'email_verification_token', type: 'varchar', nullable: true })
  emailVerificationToken!: string | null;

  @Column({ name: 'email_verification_expires', type: 'timestamp', nullable: true })
  emailVerificationExpires!: Date | null;

  @Column({ name: 'password_reset_token', type: 'varchar', nullable: true })
  passwordResetToken!: string | null;

  @Column({ name: 'password_reset_expires', type: 'timestamp', nullable: true })
  passwordResetExpires!: Date | null;

  @Column({ type: 'varchar', default: 'email' })
  provider!: string;

  @Column({ name: 'provider_id', type: 'varchar', nullable: true })
  providerId!: string;

  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
  lastLoginAt!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
