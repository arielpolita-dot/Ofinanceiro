import { RedisCacheAdapter } from './redis-cache.adapter';

const mockRedisInstance = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  ping: jest.fn(),
  quit: jest.fn(),
  connect: jest.fn(),
  on: jest.fn(),
};

jest.mock('ioredis', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => mockRedisInstance),
}));

describe('RedisCacheAdapter', () => {
  let adapter: RedisCacheAdapter;

  beforeEach(() => {
    adapter = new RedisCacheAdapter('redis://localhost:6379', 300);
    jest.clearAllMocks();
  });

  describe('get', () => {
    it('should return parsed value when key exists', async () => {
      const data = { name: 'test', count: 42 };
      mockRedisInstance.get.mockResolvedValue(JSON.stringify(data));

      const result = await adapter.get<typeof data>('my-key');

      expect(mockRedisInstance.get).toHaveBeenCalledWith('my-key');
      expect(result).toEqual(data);
    });

    it('should return null when key does not exist', async () => {
      mockRedisInstance.get.mockResolvedValue(null);

      const result = await adapter.get('missing');

      expect(result).toBeNull();
    });

    it('should return null for invalid JSON', async () => {
      mockRedisInstance.get.mockResolvedValue('not-json{{{');

      const result = await adapter.get('bad-data');

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should serialize and store with default TTL', async () => {
      const value = { hello: 'world' };

      await adapter.set('key', value);

      expect(mockRedisInstance.set).toHaveBeenCalledWith(
        'key',
        JSON.stringify(value),
        'EX',
        300,
      );
    });

    it('should use custom TTL when provided', async () => {
      await adapter.set('key', 'value', 60);

      expect(mockRedisInstance.set).toHaveBeenCalledWith(
        'key',
        '"value"',
        'EX',
        60,
      );
    });
  });

  describe('del', () => {
    it('should delete the key', async () => {
      await adapter.del('key');

      expect(mockRedisInstance.del).toHaveBeenCalledWith('key');
    });
  });

  describe('exists', () => {
    it('should return true when key exists', async () => {
      mockRedisInstance.exists.mockResolvedValue(1);

      const result = await adapter.exists('key');

      expect(result).toBe(true);
    });

    it('should return false when key does not exist', async () => {
      mockRedisInstance.exists.mockResolvedValue(0);

      const result = await adapter.exists('missing');

      expect(result).toBe(false);
    });
  });

  describe('ping', () => {
    it('should delegate to redis client', async () => {
      mockRedisInstance.ping.mockResolvedValue('PONG');

      const result = await adapter.ping();

      expect(result).toBe('PONG');
    });
  });

  describe('connect', () => {
    it('should call client connect', async () => {
      mockRedisInstance.connect.mockResolvedValue(undefined);

      await adapter.connect();

      expect(mockRedisInstance.connect).toHaveBeenCalled();
    });
  });

  describe('onModuleDestroy', () => {
    it('should quit redis connection', async () => {
      mockRedisInstance.quit.mockResolvedValue('OK');

      await adapter.onModuleDestroy();

      expect(mockRedisInstance.quit).toHaveBeenCalled();
    });
  });
});
