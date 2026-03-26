/**
 * CompanyMember Entity - User-Company relationship
 *
 * Links users to companies with a specific role.
 * Unique constraint ensures a user can only be a member once per company.
 *
 * @table app_company_members
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
import { AdminUser } from './admin-user.entity';
import { Company } from './company.entity';
import { CompanyRole } from './company-role.enum';

@Entity('app_company_members')
@Unique(['companyId', 'userId'])
@Index(['userId'])
@Index(['companyId'])
export class CompanyMember {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId!: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company!: Company;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => AdminUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: AdminUser;

  @Column({ type: 'varchar', length: 20, default: CompanyRole.MEMBER })
  role!: CompanyRole;

  @Column({ name: 'invited_by', type: 'uuid', nullable: true })
  invitedBy!: string | null;

  @Column({ name: 'joined_at', type: 'timestamp with time zone', default: () => 'NOW()' })
  joinedAt!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
