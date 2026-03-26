import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { DataSource } from 'typeorm';

const mockDataSource = {
  query: jest.fn(),
};

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: DataSource, useValue: mockDataSource }],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    jest.clearAllMocks();
  });

  describe('check', () => {
    it('should return ok status with system info', () => {
      const result = controller.check();

      expect(result).toEqual({
        status: 'ok',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        memory: expect.objectContaining({
          rss: expect.any(Number),
          heapTotal: expect.any(Number),
          heapUsed: expect.any(Number),
          external: expect.any(Number),
        }),
      });
    });

    it('should return a valid ISO timestamp', () => {
      const result = controller.check();
      const parsed = new Date(result.timestamp);

      expect(parsed.toISOString()).toBe(result.timestamp);
    });

    it('should return positive uptime', () => {
      const result = controller.check();

      expect(result.uptime).toBeGreaterThan(0);
    });
  });

  describe('live', () => {
    it('should return ok status', () => {
      const result = controller.live();

      expect(result).toEqual({ status: 'ok' });
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
