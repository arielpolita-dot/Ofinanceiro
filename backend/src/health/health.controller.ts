import { Controller, Get, Inject, Optional } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import { CACHE_PORT, CachePort } from '../common/cache/cache.port';
import { RedisCacheAdapter } from '../common/cache/redis-cache.adapter';

interface DiskStatus {
  status: 'ok' | 'error';
  freeBytes?: number;
  totalBytes?: number;
  usagePercent?: number;
  error?: string;
}

interface RedisStatus {
  status: 'ok' | 'error' | 'unavailable';
  latencyMs?: number;
  error?: string;
}

@Controller('health')
@SkipThrottle()
export class HealthController {
  constructor(
    private readonly dataSource: DataSource,
    @Optional() @Inject(CACHE_PORT) private readonly cache?: CachePort,
  ) {}

  @Get()
  async check() {
    const [redis, disk] = await Promise.all([
      this.checkRedis(),
      this.checkDisk(),
    ]);

    return {
      status: 'ok',
      version: process.env.APP_VERSION || 'unknown',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      redis,
      disk,
    };
  }

  @Get('live')
  live() {
    return { status: 'ok' };
  }

  @Get('ready')
  async ready() {
    await this.dataSource.query('SELECT 1');
    return { status: 'ok' };
  }

  private async checkRedis(): Promise<RedisStatus> {
    if (!this.cache) {
      return { status: 'unavailable' };
    }

    try {
      const start = Date.now();
      await (this.cache as RedisCacheAdapter).ping();
      const latencyMs = Date.now() - start;

      return { status: 'ok', latencyMs };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { status: 'error', error: message };
    }
  }

  private async checkDisk(): Promise<DiskStatus> {
    return new Promise((resolve) => {
      fs.statfs('/', (err, stats) => {
        if (err) {
          resolve({ status: 'error', error: err.message });
          return;
        }

        const totalBytes = stats.blocks * stats.bsize;
        const freeBytes = stats.bavail * stats.bsize;
        const usedBytes = totalBytes - freeBytes;
        const usagePercent = Math.round((usedBytes / totalBytes) * 100);

        resolve({ status: 'ok', freeBytes, totalBytes, usagePercent });
      });
    });
  }
}
