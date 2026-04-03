import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { DataSource } from 'typeorm';
import { CACHE_PORT } from '../common/cache/cache.port';
import * as fs from 'fs';

jest.mock('fs');
const mockedFs = fs as jest.Mocked<typeof fs>;

const mockDataSource = { query: jest.fn() };

const mockCache = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  ping: jest.fn(),
};

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: DataSource, useValue: mockDataSource },
        { provide: CACHE_PORT, useValue: mockCache },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    jest.clearAllMocks();
    process.env.APP_VERSION = '1.2.3';
  });

  afterEach(() => {
    delete process.env.APP_VERSION;
  });

  describe('check', () => {
    beforeEach(() => {
      mockCache.ping.mockResolvedValue('PONG');
      (mockedFs.statfs as unknown as jest.Mock).mockImplementation(
        (_path: string, cb: (err: NodeJS.ErrnoException | null, stats: fs.StatsFs) => void) => {
          cb(null, {
            blocks: 1000000,
            bsize: 4096,
            bavail: 500000,
          } as fs.StatsFs);
        },
      );
    });

    it('should return ok status with system info', async () => {
      const result = await controller.check();

      expect(result.status).toBe('ok');
      expect(result.version).toBe('1.2.3');
      expect(result.timestamp).toBeDefined();
      expect(result.uptime).toBeGreaterThan(0);
      expect(result.memory).toBeDefined();
    });

    it('should return redis status', async () => {
      const result = await controller.check();

      expect(result.redis.status).toBe('ok');
      expect(result.redis.latencyMs).toBeDefined();
    });

    it('should return disk status', async () => {
      const result = await controller.check();

      expect(result.disk.status).toBe('ok');
      expect(result.disk.totalBytes).toBeDefined();
      expect(result.disk.freeBytes).toBeDefined();
      expect(result.disk.usagePercent).toBeDefined();
    });

    it('should default version to unknown', async () => {
      delete process.env.APP_VERSION;

      const result = await controller.check();

      expect(result.version).toBe('unknown');
    });

    it('should handle redis error gracefully', async () => {
      mockCache.ping.mockRejectedValue(new Error('Connection refused'));

      const result = await controller.check();

      expect(result.status).toBe('ok');
      expect(result.redis.status).toBe('error');
      expect(result.redis.error).toBe('Connection refused');
    });

    it('should handle disk error gracefully', async () => {
      (mockedFs.statfs as unknown as jest.Mock).mockImplementation(
        (_path: string, cb: (err: NodeJS.ErrnoException | null) => void) => {
          cb(new Error('Permission denied') as NodeJS.ErrnoException);
        },
      );

      const result = await controller.check();

      expect(result.disk.status).toBe('error');
      expect(result.disk.error).toBe('Permission denied');
    });
  });

  describe('live', () => {
    it('should return ok status', () => {
      expect(controller.live()).toEqual({ status: 'ok' });
    });
  });

  describe('ready', () => {
    it('should return ok when database is reachable', async () => {
      mockDataSource.query.mockResolvedValue([{ '?column?': 1 }]);

      const result = await controller.ready();

      expect(mockDataSource.query).toHaveBeenCalledWith('SELECT 1');
      expect(result).toEqual({ status: 'ok' });
    });

    it('should throw when database is unreachable', async () => {
      mockDataSource.query.mockRejectedValue(
        new Error('Connection refused'),
      );

      await expect(controller.ready()).rejects.toThrow('Connection refused');
    });

    it('should throw on query timeout', async () => {
      mockDataSource.query.mockRejectedValue(new Error('Query timeout'));

      await expect(controller.ready()).rejects.toThrow('Query timeout');
    });
  });
});

describe('HealthController without Redis', () => {
  let controller: HealthController;

  beforeEach(async () => {
    (mockedFs.statfs as unknown as jest.Mock).mockImplementation(
      (_path: string, cb: (err: NodeJS.ErrnoException | null, stats: fs.StatsFs) => void) => {
        cb(null, { blocks: 100, bsize: 4096, bavail: 50 } as fs.StatsFs);
      },
    );

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should return redis unavailable when no cache injected', async () => {
    const result = await controller.check();

    expect(result.redis.status).toBe('unavailable');
  });
});
