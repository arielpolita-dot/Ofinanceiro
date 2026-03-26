import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { AuthBffService } from '../../modules/auth/auth-bff.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let mockAuthBffService: { validateAccessToken: jest.Mock };

  const mockUser = { id: 'user-1', email: 'test@test.com', name: 'Test' };

  function createContext(overrides: {
    cookies?: Record<string, string>;
    authorization?: string;
    method?: string;
    url?: string;
    origin?: string;
    cookieHeader?: string;
  } = {}): ExecutionContext {
    const request = {
      cookies: overrides.cookies || {},
      headers: {
        authorization: overrides.authorization,
        origin: overrides.origin || 'http://localhost',
        cookie: overrides.cookieHeader,
      },
      method: overrides.method || 'GET',
      originalUrl: overrides.url || '/api/test',
      url: overrides.url || '/api/test',
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  }

  beforeEach(() => {
    mockAuthBffService = { validateAccessToken: jest.fn() };
    guard = new AuthGuard(mockAuthBffService as unknown as AuthBffService);
  });

  describe('cookie authentication', () => {
    it('should authenticate with valid cookie token', async () => {
      mockAuthBffService.validateAccessToken.mockResolvedValue(mockUser);

      const ctx = createContext({
        cookies: { app_access_token: 'valid-token-here-12345' },
        cookieHeader: 'app_access_token=valid-token-here-12345',
      });

      const result = await guard.canActivate(ctx);

      expect(result).toBe(true);
      expect(mockAuthBffService.validateAccessToken).toHaveBeenCalledWith(
        'valid-token-here-12345',
      );

      const request = ctx.switchToHttp().getRequest();
      expect(request['user']).toEqual(mockUser);
      expect(request['adminUser']).toEqual(mockUser);
    });

    it('should prioritize cookie over bearer header', async () => {
      mockAuthBffService.validateAccessToken.mockResolvedValue(mockUser);

      const ctx = createContext({
        cookies: { app_access_token: 'cookie-token-abcdef12345' },
        authorization: 'Bearer bearer-token-here',
      });

      await guard.canActivate(ctx);

      expect(mockAuthBffService.validateAccessToken).toHaveBeenCalledWith(
        'cookie-token-abcdef12345',
      );
    });
  });

  describe('bearer authentication', () => {
    it('should authenticate with valid bearer token', async () => {
      mockAuthBffService.validateAccessToken.mockResolvedValue(mockUser);

      const ctx = createContext({
        authorization: 'Bearer valid-bearer-token-abc',
      });

      const result = await guard.canActivate(ctx);

      expect(result).toBe(true);
      expect(mockAuthBffService.validateAccessToken).toHaveBeenCalledWith(
        'valid-bearer-token-abc',
      );
    });

    it('should ignore non-Bearer authorization headers', async () => {
      const ctx = createContext({
        authorization: 'Basic dXNlcjpwYXNz',
      });

      await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('no authentication', () => {
    it('should throw UnauthorizedException when no token present', async () => {
      const ctx = createContext();
      await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
      await expect(guard.canActivate(ctx)).rejects.toThrow('Authentication required');
    });

    it('should throw when cookies object is undefined', async () => {
      const ctx = {
        switchToHttp: () => ({
          getRequest: () => ({
            cookies: undefined,
            headers: {},
            method: 'GET',
            originalUrl: '/test',
          }),
        }),
      } as unknown as ExecutionContext;

      await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('invalid token', () => {
    it('should throw when validateAccessToken returns null', async () => {
      mockAuthBffService.validateAccessToken.mockResolvedValue(null);

      const ctx = createContext({
        cookies: { app_access_token: 'invalid-token-value-12345' },
      });

      await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
      await expect(guard.canActivate(ctx)).rejects.toThrow('Invalid or expired token');
    });

    it('should re-throw UnauthorizedException from service', async () => {
      mockAuthBffService.validateAccessToken.mockRejectedValue(
        new UnauthorizedException('Token expired'),
      );

      const ctx = createContext({
        authorization: 'Bearer expired-token-12345678',
      });

      await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw Authentication failed on unexpected errors', async () => {
      mockAuthBffService.validateAccessToken.mockRejectedValue(
        new Error('Database connection failed'),
      );

      const ctx = createContext({
        authorization: 'Bearer some-token-abc-def-123',
      });

      await expect(guard.canActivate(ctx)).rejects.toThrow('Authentication failed');
    });

    it('should handle non-Error thrown from service (line 132)', async () => {
      mockAuthBffService.validateAccessToken.mockRejectedValue('string-error');

      const ctx = createContext({
        authorization: 'Bearer some-token-for-testing-1',
      });

      await expect(guard.canActivate(ctx)).rejects.toThrow('Authentication failed');
    });
  });

  describe('request property fallbacks', () => {
    it('should use request.url when originalUrl is missing (line 81)', async () => {
      mockAuthBffService.validateAccessToken.mockResolvedValue(mockUser);
      const ctx = {
        switchToHttp: () => ({
          getRequest: () => ({
            cookies: { app_access_token: 'token-value-for-test-123' },
            headers: { origin: 'http://test' },
            method: 'POST',
            originalUrl: undefined,
            url: '/fallback-url',
          }),
        }),
      } as unknown as ExecutionContext;

      const result = await guard.canActivate(ctx);
      expect(result).toBe(true);
    });

    it('should log cookie header length when present (line 99)', async () => {
      const ctx = createContext({
        cookieHeader: 'some_other_cookie=value',
      });
      await expect(guard.canActivate(ctx)).rejects.toThrow('Authentication required');
    });
  });
});
