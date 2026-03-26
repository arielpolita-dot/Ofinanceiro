import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { SecureStore } from '../../database/entities/secure-store.entity';
import { EncryptionService } from './encryption.service';

/**
 * SecureStoreService — Encrypted key-value store.
 *
 * All values are encrypted before persistence and decrypted on retrieval.
 * Supports namespaces and optional TTL for automatic expiry.
 *
 * Usage:
 *   await secureStore.set('tokens', 'refresh:user123', refreshToken, ttlMs)
 *   const token = await secureStore.get('tokens', 'refresh:user123')
 *   await secureStore.delete('tokens', 'refresh:user123')
 */
@Injectable()
export class SecureStoreService {
  private readonly logger = new Logger(SecureStoreService.name);

  constructor(
    @InjectRepository(SecureStore)
    private readonly repo: Repository<SecureStore>,
    private readonly encryptionService: EncryptionService,
  ) {}

  /** Store a value (encrypted). Upserts if key already exists. */
  async set(
    namespace: string,
    key: string,
    plainValue: string,
    ttlMs?: number,
  ): Promise<void> {
    const encrypted = this.encryptionService.encrypt(plainValue);
    const expiresAt = ttlMs ? new Date(Date.now() + ttlMs) : null;

    const existing = await this.repo.findOne({ where: { namespace, key } });

    if (existing) {
      await this.repo.update(existing.id, {
        value: encrypted,
        expiresAt,
      });
    } else {
      const entry = this.repo.create({
        namespace,
        key,
        value: encrypted,
        expiresAt,
      });
      await this.repo.save(entry);
    }
  }

  /** Retrieve and decrypt a value. Returns null if not found or expired. */
  async get(namespace: string, key: string): Promise<string | null> {
    const entry = await this.repo.findOne({ where: { namespace, key } });

    if (!entry) return null;

    if (entry.expiresAt && entry.expiresAt < new Date()) {
      await this.repo.remove(entry);
      return null;
    }

    return this.encryptionService.safeDecrypt(entry.value);
  }

  /** Check if a key exists and is not expired. */
  async has(namespace: string, key: string): Promise<boolean> {
    const entry = await this.repo.findOne({ where: { namespace, key } });
    if (!entry) return false;
    if (entry.expiresAt && entry.expiresAt < new Date()) return false;
    return true;
  }

  /** Delete a specific key. */
  async delete(namespace: string, key: string): Promise<boolean> {
    const result = await this.repo.delete({ namespace, key });
    return (result.affected ?? 0) > 0;
  }

  /** Delete all keys in a namespace. */
  async deleteNamespace(namespace: string): Promise<number> {
    const result = await this.repo.delete({ namespace });
    return result.affected ?? 0;
  }

  /** Purge all expired entries. Call periodically (e.g. daily cron). */
  async purgeExpired(): Promise<number> {
    const result = await this.repo.delete({
      expiresAt: LessThan(new Date()),
    });
    const count = result.affected ?? 0;
    if (count > 0) {
      this.logger.log(`Purged ${count} expired secure store entries`);
    }
    return count;
  }
}
