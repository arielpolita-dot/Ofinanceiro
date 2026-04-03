import { Module, Global, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_PORT } from './cache.port';
import { RedisCacheAdapter } from './redis-cache.adapter';

@Global()
@Module({
  providers: [
    {
      provide: CACHE_PORT,
      useFactory: async (config: ConfigService) => {
        const logger = new Logger('CacheModule');
        const redisUrl = config.get<string>('REDIS_URL');

        if (!redisUrl) {
          logger.warn('REDIS_URL not set - cache will be unavailable');
          return null;
        }

        const defaultTtl = config.get<number>('CACHE_DEFAULT_TTL', 300);
        const adapter = new RedisCacheAdapter(redisUrl, defaultTtl);

        try {
          await adapter.connect();
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          logger.error(`Failed to connect to Redis: ${message}`);
        }

        return adapter;
      },
      inject: [ConfigService],
    },
  ],
  exports: [CACHE_PORT],
})
export class CacheModule {}
