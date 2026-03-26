/**
 * CompanyInvite Entity - Pending invitations to join a company
 *
 * Stores invite tokens for users who don't yet have an account.
 * Invites are auto-accepted when the user logs in for the first time.
 *
 * @table app_company_invites
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Company } from './company.entity';
import { AdminUser } from './admin-user.entity';
import { CompanyRole } from './company-role.enum';

export enum InviteStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  EXPIRED = 'expired',
  CANCELED = 'canceled',
}

@Entity('app_company_invites')
@Unique(['email', 'companyId'])
@Index(['token'], { unique: true })
@Index(['status'])
@Index(['email'])
export class CompanyInvite {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId!: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company!: Company;

  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 20, default: CompanyRole.MEMBER })
  role!: CompanyRole;

  @Column({ name: 'invited_by', type: 'uuid' })
  invitedBy!: string;

  @ManyToOne(() => AdminUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invited_by' })
  inviter!: AdminUser;

  @Column({ type: 'varchar', length: 255, unique: true })
  token!: string;

  @Column({ type: 'varchar', length: 20, default: InviteStatus.PENDING })
  status!: InviteStatus;

  @Column({ name: 'expires_at', type: 'timestamp with time zone' })
  expiresAt!: Date;

  @Column({ name: 'accepted_at', type: 'timestamp with time zone', nullable: true })
  acceptedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
