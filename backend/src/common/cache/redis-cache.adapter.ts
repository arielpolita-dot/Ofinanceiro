import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { CachePort } from './cache.port';

const DEFAULT_TTL_SECONDS = 300;

@Injectable()
export class RedisCacheAdapter implements CachePort, OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheAdapter.name);
  private readonly client: Redis;
  private readonly defaultTtl: number;

  constructor(redisUrl: string, defaultTtl = DEFAULT_TTL_SECONDS) {
    this.defaultTtl = defaultTtl;
    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => Math.min(times * 200, 5000),
      lazyConnect: true,
    });

    this.client.on('error', (err: Error) => {
      this.logger.error(`Redis connection error: ${err.message}`);
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }

  getClient(): Redis {
    return this.client;
  }

  async connect(): Promise<void> {
    await this.client.connect();
    this.logger.log('Redis connected');
  }

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.client.get(key);
    if (raw === null) return null;

    return this.deserialize<T>(raw);
  }

  async set(
    key: string,
    value: unknown,
    ttlSeconds?: number,
  ): Promise<void> {
    const serialized = JSON.stringify(value);
    const ttl = ttlSeconds ?? this.defaultTtl;

    await this.client.set(key, serialized, 'EX', ttl);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  async ping(): Promise<string> {
    return this.client.ping();
  }

  private deserialize<T>(raw: string): T | null {
    try {
      return JSON.parse(raw) as T;
    } catch {
      this.logger.warn(`Failed to deserialize cache value`);
      return null;
    }
  }
}
