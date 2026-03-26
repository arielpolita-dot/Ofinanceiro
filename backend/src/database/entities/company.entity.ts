/**
 * Company Entity - Multi-tenant unit
 *
 * Represents an organization/workspace in the system.
 * Each user belongs to one or more companies via CompanyMember.
 *
 * @table app_companies
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { AdminUser } from './admin-user.entity';

@Entity('app_companies')
@Index(['slug'], { unique: true })
@Index(['ownerId'])
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId!: string;

  @ManyToOne(() => AdminUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner!: AdminUser;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  document!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description!: string | null;

  @Column({ name: 'logo_url', type: 'varchar', length: 500, nullable: true })
  logoUrl!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  website!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  industry!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
