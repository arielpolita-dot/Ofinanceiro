import { ExecutionContext } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { CustomThrottlerGuard } from './custom-throttler.guard';

describe('CustomThrottlerGuard', () => {
  let guard: CustomThrottlerGuard;

  beforeEach(() => {
    // ThrottlerGuard requires dependencies, but we only test our overrides
    guard = Object.create(CustomThrottlerGuard.prototype);
  });

  describe('getTracker', () => {
    it('should return user ID when user is authenticated', async () => {
      const req = { user: { id: 'user-123' }, ip: '1.2.3.4' };
      const result = await guard['getTracker'](req);
      expect(result).toBe('user-123');
    });

    it('should return IP when user is not authenticated', async () => {
      const req = { ip: '192.168.1.1' };
      const result = await guard['getTracker'](req);
      expect(result).toBe('192.168.1.1');
    });

    it('should return IP when user object has no id', async () => {
      const req = { user: {}, ip: '10.0.0.1' };
      const result = await guard['getTracker'](req);
      expect(result).toBe('10.0.0.1');
    });

    it('should return "unknown" when no user and no IP', async () => {
      const req = {};
      const result = await guard['getTracker'](req);
      expect(result).toBe('unknown');
    });

    it('should return "unknown" when user is null and ip is undefined', async () => {
      const req = { user: null, ip: undefined };
      const result = await guard['getTracker'](req);
      expect(result).toBe('unknown');
    });
  });

  describe('throwThrottlingException', () => {
    it('should throw ThrottlerException with Portuguese message', async () => {
      const mockContext = {} as ExecutionContext;
      const mockDetail = {} as any;

      await expect(
        guard['throwThrottlingException'](mockContext, mockDetail),
      ).rejects.toThrow(ThrottlerException);

      await expect(
        guard['throwThrottlingException'](mockContext, mockDetail),
      ).rejects.toThrow('Muitas requisições. Aguarde um momento antes de tentar novamente.');
    });
  });

  describe('getErrorMessage', () => {
    it('should return Portuguese error message', async () => {
      const mockContext = {} as ExecutionContext;
      const mockDetail = {} as any;

      const message = await guard['getErrorMessage'](mockContext, mockDetail);
      expect(message).toBe(
        'Muitas requisições. Aguarde um momento antes de tentar novamente.',
      );
    });
  });
});
