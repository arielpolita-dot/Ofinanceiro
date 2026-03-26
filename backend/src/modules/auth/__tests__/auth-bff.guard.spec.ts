import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthBffGuard } from '../auth-bff.guard';
import { AuthBffService } from '../auth-bff.service';

const mockAuthService = { validateAccessToken: jest.fn() };

const createContext = (headers: Record<string, string> = {}): ExecutionContext => {
  const request: any = { headers, user: undefined };
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
};

describe('AuthBffGuard', () => {
  let guard: AuthBffGuard;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthBffGuard,
        { provide: AuthBffService, useValue: mockAuthService },
      ],
    }).compile();
    guard = module.get(AuthBffGuard);
  });

  it('should throw when no Authorization header', async () => {
    const ctx = createContext({});
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
    await expect(guard.canActivate(ctx)).rejects.toThrow('Authentication required');
  });

  it('should throw when Authorization header is not Bearer', async () => {
    const ctx = createContext({ authorization: 'Basic abc123' });
    await expect(guard.canActivate(ctx)).rejects.toThrow('Authentication required');
  });

  it('should throw when token is empty after Bearer', async () => {
    const ctx = createContext({ authorization: 'Bearer ' });
    // extractToken returns null for empty token, so guard throws "Authentication required"
    await expect(guard.canActivate(ctx)).rejects.toThrow('Authentication required');
  });

  it('should throw when token is invalid', async () => {
    mockAuthService.validateAccessToken.mockResolvedValue(null);
    const ctx = createContext({ authorization: 'Bearer invalid-token' });
    await expect(guard.canActivate(ctx)).rejects.toThrow('Invalid or expired token');
    expect(mockAuthService.validateAccessToken).toHaveBeenCalledWith('invalid-token');
  });

  it('should return true and attach user when token is valid', async () => {
    const user = { id: 'u1', email: 'a@b.c', name: 'Test' };
    mockAuthService.validateAccessToken.mockResolvedValue(user);
    const ctx = createContext({ authorization: 'Bearer valid-token' });
    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
    const request = ctx.switchToHttp().getRequest();
    expect(request.user).toEqual(user);
  });

  it('should extract token correctly from Bearer header', async () => {
    const user = { id: 'u1', email: 'a@b.c' };
    mockAuthService.validateAccessToken.mockResolvedValue(user);
    const ctx = createContext({ authorization: 'Bearer my.jwt.token' });
    await guard.canActivate(ctx);
    expect(mockAuthService.validateAccessToken).toHaveBeenCalledWith('my.jwt.token');
  });
});
