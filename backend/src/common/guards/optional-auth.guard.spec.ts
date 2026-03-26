import { ExecutionContext } from '@nestjs/common';
import { OptionalAuthGuard } from './optional-auth.guard';
import { AuthBffService } from '../../modules/auth/auth-bff.service';

describe('OptionalAuthGuard', () => {
  let guard: OptionalAuthGuard;
  let mockAuthBffService: { validateAccessToken: jest.Mock };

  const mockUser = { id: 'user-1', email: 'test@test.com', name: 'Test' };

  function createContext(overrides: {
    cookies?: Record<string, string>;
    authorization?: string;
  } = {}): ExecutionContext {
    const request = {
      cookies: overrides.cookies || {},
      headers: {
        authorization: overrides.authorization,
      },
      method: 'GET',
      originalUrl: '/api/test',
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  }

  beforeEach(() => {
    mockAuthBffService = { validateAccessToken: jest.fn() };
    guard = new OptionalAuthGuard(
      mockAuthBffService as unknown as AuthBffService,
    );
  });

  describe('with valid token', () => {
    it('should attach user when cookie token is valid', async () => {
      mockAuthBffService.validateAccessToken.mockResolvedValue(mockUser);

      const ctx = createContext({
        cookies: { app_access_token: 'valid-token' },
      });

      const result = await guard.canActivate(ctx);

      expect(result).toBe(true);
      const request = ctx.switchToHttp().getRequest();
      expect(request['user']).toEqual(mockUser);
      expect(request['adminUser']).toEqual(mockUser);
    });

    it('should attach user when bearer token is valid', async () => {
      mockAuthBffService.validateAccessToken.mockResolvedValue(mockUser);

      const ctx = createContext({
        authorization: 'Bearer valid-bearer-token',
      });

      const result = await guard.canActivate(ctx);

      expect(result).toBe(true);
      const request = ctx.switchToHttp().getRequest();
      expect(request['user']).toEqual(mockUser);
    });

    it('should prioritize cookie over bearer', async () => {
      mockAuthBffService.validateAccessToken.mockResolvedValue(mockUser);

      const ctx = createContext({
        cookies: { app_access_token: 'cookie-token' },
        authorization: 'Bearer bearer-token',
      });

      await guard.canActivate(ctx);

      expect(mockAuthBffService.validateAccessToken).toHaveBeenCalledWith('cookie-token');
    });
  });

  describe('without token', () => {
    it('should return true without attaching user', async () => {
      const ctx = createContext();
      const result = await guard.canActivate(ctx);

      expect(result).toBe(true);
      expect(mockAuthBffService.validateAccessToken).not.toHaveBeenCalled();
      const request = ctx.switchToHttp().getRequest();
      expect(request['user']).toBeUndefined();
    });

    it('should return true when cookies is undefined', async () => {
      const ctx = {
        switchToHttp: () => ({
          getRequest: () => ({
            cookies: undefined,
            headers: {},
          }),
        }),
      } as unknown as ExecutionContext;

      const result = await guard.canActivate(ctx);
      expect(result).toBe(true);
    });

    it('should ignore non-Bearer authorization headers', async () => {
      const ctx = createContext({ authorization: 'Basic abc123' });
      const result = await guard.canActivate(ctx);

      expect(result).toBe(true);
      expect(mockAuthBffService.validateAccessToken).not.toHaveBeenCalled();
    });
  });

  describe('with invalid token', () => {
    it('should return true when validateAccessToken returns null', async () => {
      mockAuthBffService.validateAccessToken.mockResolvedValue(null);

      const ctx = createContext({
        cookies: { app_access_token: 'invalid-token' },
      });

      const result = await guard.canActivate(ctx);

      expect(result).toBe(true);
      const request = ctx.switchToHttp().getRequest();
      expect(request['user']).toBeUndefined();
    });

    it('should return true when validation throws error', async () => {
      mockAuthBffService.validateAccessToken.mockRejectedValue(
        new Error('Token expired'),
      );

      const ctx = createContext({
        authorization: 'Bearer expired-token',
      });

      const result = await guard.canActivate(ctx);

      expect(result).toBe(true);
      const request = ctx.switchToHttp().getRequest();
      expect(request['user']).toBeUndefined();
    });
  });
});
