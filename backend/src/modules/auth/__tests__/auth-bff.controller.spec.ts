import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthBffController } from '../auth-bff.controller';
import { AuthBffService } from '../auth-bff.service';
import { CompanyMember } from '../../../database/entities/company-member.entity';

const mockAuthService = {
  getLoginUrl: jest.fn(),
  getRegisterUrl: jest.fn(),
  exchangeCodeForTokens: jest.fn(),
  validateAccessToken: jest.fn(),
  refreshAccessToken: jest.fn(),
  logout: jest.fn(),
};

const mockConfig = {
  get: jest.fn((key: string) => {
    if (key === 'FRONTEND_URL') return 'https://app.test';
    if (key === 'NODE_ENV') return 'production';
    return '';
  }),
};

const mockMemberRepo = {
  find: jest.fn().mockResolvedValue([]),
};

const createRes = () => ({
  redirect: jest.fn(),
  cookie: jest.fn(),
  clearCookie: jest.fn(),
});

const createReq = (overrides: Record<string, unknown> = {}) => ({
  ip: '1.2.3.4',
  connection: { remoteAddress: '1.2.3.4' },
  headers: { 'user-agent': 'TestAgent' },
  cookies: {},
  ...overrides,
});

describe('AuthBffController', () => {
  let controller: AuthBffController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthBffController],
      providers: [
        { provide: AuthBffService, useValue: mockAuthService },
        { provide: ConfigService, useValue: mockConfig },
        { provide: getRepositoryToken(CompanyMember), useValue: mockMemberRepo },
      ],
    }).compile();
    controller = module.get(AuthBffController);
  });

  describe('GET /login', () => {
    it('should redirect to login URL', async () => {
      mockAuthService.getLoginUrl.mockResolvedValue('https://auth.test/login?state=abc');
      const res = createRes();
      await controller.login(res as any);
      expect(res.redirect).toHaveBeenCalledWith('https://auth.test/login?state=abc');
    });

    it('should redirect to frontend with error on failure', async () => {
      mockAuthService.getLoginUrl.mockRejectedValue(new Error('Auth down'));
      const res = createRes();
      await controller.login(res as any);
      expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('https://app.test?error='));
    });
  });

  describe('GET /register', () => {
    it('should redirect to register URL', async () => {
      mockAuthService.getRegisterUrl.mockResolvedValue('https://auth.test/register?state=abc');
      const res = createRes();
      await controller.register(res as any);
      expect(res.redirect).toHaveBeenCalledWith('https://auth.test/register?state=abc');
    });

    it('should redirect to frontend with error on failure', async () => {
      mockAuthService.getRegisterUrl.mockRejectedValue(new Error('Auth down'));
      const res = createRes();
      await controller.register(res as any);
      expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('https://app.test?error='));
    });
  });

  describe('POST /callback', () => {
    it('should exchange code and set cookie', async () => {
      const user = { id: 'u1', email: 'a@b.c', name: 'A' };
      mockAuthService.exchangeCodeForTokens.mockResolvedValue({
        accessToken: 'at-123', user, expiresIn: 3600,
      });
      const res = createRes();
      const req = createReq();
      const result = await controller.callback({ code: 'code-abc' } as any, req as any, res as any);
      expect(result).toEqual({ token_type: 'Bearer', user });
      expect(res.cookie).toHaveBeenCalledWith('app_access_token', 'at-123', expect.objectContaining({
        httpOnly: true, secure: true, sameSite: 'none',
      }));
    });

    it('should rethrow service errors', async () => {
      mockAuthService.exchangeCodeForTokens.mockRejectedValue(
        new UnauthorizedException('Invalid code'),
      );
      const res = createRes();
      const req = createReq();
      await expect(controller.callback({ code: 'bad-code' } as any, req as any, res as any))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('GET /status', () => {
    it('should return authenticated:false when no token', async () => {
      const req = createReq();
      const result = await controller.status(req as any);
      expect(result).toEqual({ authenticated: false });
    });

    it('should return authenticated:true with user and companies from cookie token', async () => {
      const user = { id: 'u1', email: 'a@b.c' };
      mockAuthService.validateAccessToken.mockResolvedValue(user);
      mockMemberRepo.find.mockResolvedValue([]);
      const req = createReq({ cookies: { app_access_token: 'valid-token' } });
      const result = await controller.status(req as any);
      expect(result).toEqual({
        authenticated: true, user, companies: [], activeCompanyId: null,
      });
    });

    it('should extract token from Authorization header', async () => {
      const user = { id: 'u1', email: 'a@b.c' };
      mockAuthService.validateAccessToken.mockResolvedValue(user);
      mockMemberRepo.find.mockResolvedValue([]);
      const req = createReq({ headers: { authorization: 'Bearer header-token', 'user-agent': 'UA' } });
      const result = await controller.status(req as any);
      expect(mockAuthService.validateAccessToken).toHaveBeenCalledWith('header-token');
      expect(result).toEqual({
        authenticated: true, user, companies: [], activeCompanyId: null,
      });
    });

    it('should prefer cookie over Authorization header', async () => {
      mockAuthService.validateAccessToken.mockResolvedValue({ id: 'u1' });
      mockMemberRepo.find.mockResolvedValue([]);
      const req = createReq({
        cookies: { app_access_token: 'cookie-token' },
        headers: { authorization: 'Bearer header-token', 'user-agent': 'UA' },
      });
      await controller.status(req as any);
      expect(mockAuthService.validateAccessToken).toHaveBeenCalledWith('cookie-token');
    });

    it('should return authenticated:false when token is invalid', async () => {
      mockAuthService.validateAccessToken.mockResolvedValue(null);
      const req = createReq({ cookies: { app_access_token: 'expired-token' } });
      const result = await controller.status(req as any);
      expect(result).toEqual({ authenticated: false });
    });
  });

  describe('POST /refresh', () => {
    it('should refresh token and set cookie', async () => {
      const user = { id: 'u1', email: 'a@b.c' };
      mockAuthService.refreshAccessToken.mockResolvedValue({
        accessToken: 'at-new', user, expiresIn: 7200,
      });
      const req = createReq({ user: { id: 'u1' } });
      const res = createRes();
      const result = await controller.refresh({ user_id: 'u1' } as any, req as any, res as any);
      expect(result).toEqual({ token_type: 'Bearer', user });
      expect(res.cookie).toHaveBeenCalledWith('app_access_token', 'at-new', expect.objectContaining({
        httpOnly: true, maxAge: 7200000,
      }));
    });

    it('should clear cookie and throw when session expired', async () => {
      mockAuthService.refreshAccessToken.mockResolvedValue(null);
      const req = createReq({ user: { id: 'u1' } });
      const res = createRes();
      await expect(controller.refresh({ user_id: 'u1' } as any, req as any, res as any)).rejects.toThrow(UnauthorizedException);
      expect(res.clearCookie).toHaveBeenCalledWith('app_access_token', expect.any(Object));
    });
  });

  describe('POST /logout', () => {
    it('should call logout service and clear cookie', async () => {
      mockAuthService.validateAccessToken.mockResolvedValue({ id: 'u1' });
      mockAuthService.logout.mockResolvedValue(undefined);
      const res = createRes();
      const req = createReq({ cookies: { app_access_token: 'valid-token' } });
      const result = await controller.logout(req as any, res as any);
      expect(result).toEqual({ success: true, message: 'Logged out successfully' });
      expect(mockAuthService.logout).toHaveBeenCalledWith('u1', '1.2.3.4', 'TestAgent');
      expect(res.clearCookie).toHaveBeenCalled();
    });

    it('should clear cookie even without token', async () => {
      const res = createRes();
      const req = createReq();
      const result = await controller.logout(req as any, res as any);
      expect(result).toEqual({ success: true, message: 'Logged out successfully' });
      expect(mockAuthService.logout).not.toHaveBeenCalled();
      expect(res.clearCookie).toHaveBeenCalled();
    });

    it('should use req.connection.remoteAddress when req.ip is falsy', async () => {
      mockAuthService.validateAccessToken.mockResolvedValue({ id: 'u1' });
      mockAuthService.logout.mockResolvedValue(undefined);
      const res = createRes();
      const req = createReq({ ip: undefined, cookies: { app_access_token: 'valid-token' } });
      await controller.logout(req as any, res as any);
      expect(mockAuthService.logout).toHaveBeenCalledWith('u1', '1.2.3.4', 'TestAgent');
    });
  });

  describe('constructor defaults', () => {
    it('should use default frontendUrl when FRONTEND_URL not configured', async () => {
      const configNoUrl = { get: jest.fn(() => '') };
      const module = await Test.createTestingModule({
        controllers: [AuthBffController],
        providers: [
          { provide: AuthBffService, useValue: mockAuthService },
          { provide: ConfigService, useValue: configNoUrl },
          { provide: getRepositoryToken(CompanyMember), useValue: mockMemberRepo },
        ],
      }).compile();
      const ctrl = module.get(AuthBffController);
      mockAuthService.getLoginUrl.mockRejectedValue(new Error('fail'));
      const res = createRes();
      await ctrl.login(res as any);
      expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('http://localhost:3000'));
    });
  });

  describe('error instanceof checks', () => {
    it('should use generic message when login error is not Error instance', async () => {
      mockAuthService.getLoginUrl.mockRejectedValue('string-error');
      const res = createRes();
      await controller.login(res as any);
      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent('Failed to generate login URL')),
      );
    });

    it('should use generic message when register error is not Error instance', async () => {
      mockAuthService.getRegisterUrl.mockRejectedValue(42);
      const res = createRes();
      await controller.register(res as any);
      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent('Failed to generate register URL')),
      );
    });

    it('should use generic message when callback error is not Error instance', async () => {
      mockAuthService.exchangeCodeForTokens.mockRejectedValue('non-error');
      const res = createRes();
      const req = createReq();
      await expect(controller.callback({ code: 'code' } as any, req as any, res as any)).rejects.toBe('non-error');
    });

    it('should use req.connection.remoteAddress in callback when ip is falsy', async () => {
      const user = { id: 'u1', email: 'a@b.c', name: 'A' };
      mockAuthService.exchangeCodeForTokens.mockResolvedValue({ accessToken: 'at', user, expiresIn: 3600 });
      const res = createRes();
      const req = createReq({ ip: '' });
      await controller.callback({ code: 'code' } as any, req as any, res as any);
      expect(mockAuthService.exchangeCodeForTokens).toHaveBeenCalledWith(
        'code', expect.any(String), '1.2.3.4', 'TestAgent',
      );
    });

    it('should use default cookie maxAge when expiresIn not provided', async () => {
      const user = { id: 'u1', email: 'a@b.c' };
      mockAuthService.exchangeCodeForTokens.mockResolvedValue({ accessToken: 'at', user, expiresIn: undefined });
      const res = createRes();
      const req = createReq();
      await controller.callback({ code: 'code' } as any, req as any, res as any);
      expect(res.cookie).toHaveBeenCalledWith('app_access_token', 'at', expect.objectContaining({
        maxAge: 24 * 60 * 60 * 1000,
      }));
    });
  });
});
