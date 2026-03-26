import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * SecureStore - Encrypted key-value store.
 * All values are encrypted at rest via AES-256-GCM.
 */
@Entity('app_secure_store')
@Index(['namespace', 'key'], { unique: true })
export class SecureStore {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Logical namespace (e.g. 'auth', 'billing', 'tokens') */
  @Column({ name: 'namespace', type: 'varchar', length: 100 })
  namespace!: string;

  /** Key within the namespace */
  @Column({ name: 'key', type: 'varchar', length: 255 })
  key!: string;

  /** Encrypted value (AES-256-GCM format: iv:authTag:ciphertext) */
  @Column({ name: 'value', type: 'text' })
  value!: string;

  /** Optional TTL — entries past this date are stale */
  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
