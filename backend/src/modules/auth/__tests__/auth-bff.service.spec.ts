import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthBffService } from '../auth-bff.service';
import { AdminUser } from '../../../database/entities/admin-user.entity';
import { AdminSession } from '../../../database/entities/admin-session.entity';
import { SessionService } from '../session.service';
import { UserSyncService } from '../user-sync.service';
import { ActivityLogService } from '../../../common/activity-log/activity-log.service';
import { EncryptionService } from '../../../common/services/encryption.service';
import { ConversionsTrackingService } from '../../../common/services/conversions-tracking.service';

const mockFetch = jest.fn();
global.fetch = mockFetch;
const mockUserRepo = { findOne: jest.fn(), create: jest.fn(), save: jest.fn(), update: jest.fn() };
const mockSessionRepo = { findOne: jest.fn(), create: jest.fn(), save: jest.fn(), update: jest.fn() };
const mockActivityLog = { log: jest.fn() };
const mockEncryptionService = { encrypt: jest.fn().mockReturnValue('encrypted'), decrypt: jest.fn().mockReturnValue('decrypted') };
const mockConversionsTracking = {
  trackCompleteRegistration: jest.fn().mockResolvedValue(undefined),
  trackLead: jest.fn().mockResolvedValue(undefined),
  trackPurchase: jest.fn().mockResolvedValue(undefined),
};
const mockConfig = {
  get: jest.fn((key: string) => {
    const v: Record<string, string> = { AUTHIFY_URL: 'https://auth.test', AUTHIFY_FRONTEND_URL: 'https://auth-fe.test', AUTHIFY_API_KEY: 'test-api-key', FRONTEND_URL: 'https://app.test' };
    return v[key] || '';
  }),
};
const providers = [
  AuthBffService, SessionService, UserSyncService,
  { provide: ConfigService, useValue: mockConfig },
  { provide: getRepositoryToken(AdminUser), useValue: mockUserRepo },
  { provide: getRepositoryToken(AdminSession), useValue: mockSessionRepo },
  { provide: ActivityLogService, useValue: mockActivityLog },
  { provide: EncryptionService, useValue: mockEncryptionService },
  { provide: ConversionsTrackingService, useValue: mockConversionsTracking },
];

describe('AuthBffService', () => {
  let service: AuthBffService;
  beforeEach(async () => {
    jest.clearAllMocks();
    service = (await Test.createTestingModule({ providers }).compile()).get(AuthBffService);
  });

  describe('getLoginUrl', () => {
    it('should return login URL', async () => {
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ loginUrl: 'https://auth.test/auth/login?state=abc' }) });
      expect(await service.getLoginUrl()).toBe('https://auth.test/auth/login?state=abc');
    });
    it('should throw on Authify error with message', async () => {
      mockFetch.mockResolvedValue({ ok: false, json: () => Promise.resolve({ message: 'Bad' }) });
      await expect(service.getLoginUrl()).rejects.toThrow('Failed to generate login URL');
    });
    it('should use fallback when error has no message (line 52)', async () => {
      mockFetch.mockResolvedValue({ ok: false, json: () => Promise.resolve({}) });
      await expect(service.getLoginUrl()).rejects.toThrow('Failed to generate login URL');
    });
    it('should throw on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network'));
      await expect(service.getLoginUrl()).rejects.toThrow('Failed to generate login URL');
    });
  });

  describe('getRegisterUrl', () => {
    it('should return register URL', async () => {
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ loginUrl: 'https://auth.test/auth/login?state=abc' }) });
      expect(await service.getRegisterUrl()).toBe('https://auth.test/auth/register?state=abc');
    });
    it('should throw on error with message', async () => {
      mockFetch.mockResolvedValue({ ok: false, json: () => Promise.resolve({ message: 'Bad' }) });
      await expect(service.getRegisterUrl()).rejects.toThrow('Failed to generate register URL');
    });
    it('should use fallback when error has no message (line 74)', async () => {
      mockFetch.mockResolvedValue({ ok: false, json: () => Promise.resolve({}) });
      await expect(service.getRegisterUrl()).rejects.toThrow('Failed to generate register URL');
    });
    it('should throw on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network'));
      await expect(service.getRegisterUrl()).rejects.toThrow('Failed to generate register URL');
    });
  });

  describe('validateAccessToken', () => {
    it('should return user when valid', async () => {
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ id: 'u1', email: 'a@b.c', name: 'A', avatar: null, projectId: 'p1' }) });
      expect(await service.validateAccessToken('valid')).toEqual({ id: 'u1', email: 'a@b.c', name: 'A', avatar: null, projectId: 'p1' });
    });
    it('should return null when invalid', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 401, text: () => Promise.resolve('Unauthorized') });
      expect(await service.validateAccessToken('bad')).toBeNull();
    });
    it('should return null on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Net'));
      expect(await service.validateAccessToken('any')).toBeNull();
    });
    it('should handle text() rejection (line 163)', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 500, text: () => Promise.reject(new Error('fail')) });
      expect(await service.validateAccessToken('bad-token-123456789012345')).toBeNull();
    });
    it('should handle non-Error thrown (line 167)', async () => {
      mockFetch.mockRejectedValue('string-error');
      expect(await service.validateAccessToken('token-12345678901234')).toBeNull();
    });
    it('should handle empty token (line 151)', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 401, text: () => Promise.resolve('') });
      expect(await service.validateAccessToken('')).toBeNull();
    });
  });

  describe('exchangeCodeForTokens', () => {
    const tokenResp = { access_token: 'at-123', refresh_token: 'rt-123', token_type: 'Bearer', expires_in: 3600, user: { id: 'u1', email: 'test@test.com', name: 'Test' } };
    const sess = { id: 'sess-1' };
    beforeEach(() => {
      mockUserRepo.findOne.mockResolvedValue({ id: 'u1', email: 'test@test.com', name: 'Test' });
      mockSessionRepo.update.mockResolvedValue({ affected: 0 });
      mockSessionRepo.create.mockReturnValue(sess);
      mockSessionRepo.save.mockResolvedValue(sess);
    });

    it('should exchange code and return tokens', async () => {
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(tokenResp) });
      const r = await service.exchangeCodeForTokens('code', 'url', '1.2.3.4', 'UA');
      expect(r.accessToken).toBe('at-123');
      expect(mockActivityLog.log).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
    it('should throw on Authify rejection with error_code', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 401, json: () => Promise.resolve({ error_code: 'invalid_grant', error_description: 'Expired' }) });
      await expect(service.exchangeCodeForTokens('bad', 'url')).rejects.toThrow(UnauthorizedException);
    });
    it('should throw with error_description only', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 400, json: () => Promise.resolve({ error_description: 'Bad code' }) });
      await expect(service.exchangeCodeForTokens('bad', 'url')).rejects.toThrow('Bad code');
    });
    it('should throw Token exchange failed when no description', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 400, json: () => Promise.resolve({}) });
      await expect(service.exchangeCodeForTokens('bad', 'url')).rejects.toThrow('Token exchange failed');
    });
    it('should create new user if not found', async () => {
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(tokenResp) });
      mockUserRepo.findOne.mockResolvedValue(null);
      mockUserRepo.create.mockReturnValue({ id: 'u1' });
      mockUserRepo.save.mockResolvedValue({ id: 'u1' });
      expect((await service.exchangeCodeForTokens('c', 'u')).accessToken).toBe('at-123');
    });
    it('should update user on email match keeping local ID', async () => {
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(tokenResp) });
      mockUserRepo.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'old', email: 'test@test.com', name: 'Old' });
      await service.exchangeCodeForTokens('c', 'u');
      expect(mockUserRepo.update).toHaveBeenCalledWith('old', expect.objectContaining({ name: 'Test' }));
    });
    it('should throw on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Connection refused'));
      await expect(service.exchangeCodeForTokens('c', 'u', '1.2.3.4')).rejects.toThrow(UnauthorizedException);
    });
    it('should handle non-Error in catch (line 131)', async () => {
      mockFetch.mockRejectedValue('string-error');
      await expect(service.exchangeCodeForTokens('c', 'u')).rejects.toThrow(UnauthorizedException);
    });
    it('should rethrow ensureLocalUser DB error', async () => {
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(tokenResp) });
      mockUserRepo.findOne.mockRejectedValue(new Error('DB lost'));
      await expect(service.exchangeCodeForTokens('c', 'u')).rejects.toThrow(UnauthorizedException);
    });
    it('should handle non-Error thrown in ensureLocalUser (line 289)', async () => {
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(tokenResp) });
      mockUserRepo.findOne.mockRejectedValue('string-db-error');
      await expect(service.exchangeCodeForTokens('c', 'u')).rejects.toThrow(UnauthorizedException);
    });
    it('should use existing name when authUser.name is null (line 279)', async () => {
      const noName = { ...tokenResp, user: { id: 'u1', email: 'test@test.com', name: null } };
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(noName) });
      mockUserRepo.findOne.mockResolvedValue({ id: 'u1', name: 'Existing' });
      await service.exchangeCodeForTokens('c', 'u');
      expect(mockUserRepo.update).toHaveBeenCalledWith('u1', expect.objectContaining({ name: 'Existing' }));
    });
    it('should use existing name on ID mismatch when name null (line 270)', async () => {
      const noName = { ...tokenResp, user: { id: 'u1', email: 'test@test.com', name: null } };
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(noName) });
      mockUserRepo.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'old', email: 'test@test.com', name: 'OldName' });
      await service.exchangeCodeForTokens('c', 'u');
      expect(mockUserRepo.update).toHaveBeenCalledWith('old', expect.objectContaining({ name: 'OldName' }));
    });
    it('should use default expiresIn for session when falsy (line 246)', async () => {
      const noExp = { ...tokenResp, expires_in: undefined };
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(noExp) });
      expect((await service.exchangeCodeForTokens('c', 'u')).accessToken).toBe('at-123');
    });
  });

  describe('refreshAccessToken', () => {
    it('should return null when no session', async () => {
      mockSessionRepo.findOne.mockResolvedValue(null);
      expect(await service.refreshAccessToken('u1')).toBeNull();
    });
    it('should deactivate expired session', async () => {
      mockSessionRepo.findOne.mockResolvedValue({ id: 's1', expiresAt: new Date('2020-01-01'), active: true });
      expect(await service.refreshAccessToken('u1')).toBeNull();
      expect(mockSessionRepo.update).toHaveBeenCalledWith('s1', { active: false });
    });
    it('should refresh and update session', async () => {
      mockSessionRepo.findOne.mockResolvedValue({ id: 's1', expiresAt: new Date(Date.now() + 86400000), refreshToken: 'rt' });
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ access_token: 'at-new', refresh_token: 'rt-new', expires_in: 3600, user: { id: 'u1', email: 'a@b.c', name: 'A' } }) });
      expect((await service.refreshAccessToken('u1'))!.accessToken).toBe('at-new');
    });
    it('should deactivate on refresh fail', async () => {
      mockSessionRepo.findOne.mockResolvedValue({ id: 's1', expiresAt: new Date(Date.now() + 86400000), refreshToken: 'rt' });
      mockFetch.mockResolvedValue({ ok: false, status: 401 });
      expect(await service.refreshAccessToken('u1')).toBeNull();
    });
    it('should return null on network error', async () => {
      mockSessionRepo.findOne.mockResolvedValue({ id: 's1', expiresAt: new Date(Date.now() + 86400000), refreshToken: 'rt' });
      mockFetch.mockRejectedValue(new Error('Net'));
      expect(await service.refreshAccessToken('u1')).toBeNull();
    });
    it('should use 24h default when expires_in is falsy (line 197)', async () => {
      mockSessionRepo.findOne.mockResolvedValue({ id: 's1', expiresAt: new Date(Date.now() + 86400000), refreshToken: 'rt' });
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ access_token: 'at', refresh_token: 'rt-new', expires_in: 0, user: { id: 'u1', email: 'a@b.c', name: 'A' } }) });
      expect(await service.refreshAccessToken('u1')).toBeTruthy();
    });
  });

  describe('logout', () => {
    it('should revoke token and deactivate session', async () => {
      mockSessionRepo.findOne.mockResolvedValue({ id: 's1', refreshToken: 'rt' });
      mockFetch.mockResolvedValue({ ok: true });
      await service.logout('u1', '1.2.3.4', 'UA');
      expect(mockSessionRepo.update).toHaveBeenCalledWith('s1', { active: false });
    });
    it('should still deactivate if revoke fails', async () => {
      mockSessionRepo.findOne.mockResolvedValue({ id: 's1', refreshToken: 'rt' });
      mockFetch.mockRejectedValue(new Error('Revoke failed'));
      await service.logout('u1');
      expect(mockSessionRepo.update).toHaveBeenCalledWith('s1', { active: false });
    });
    it('should log activity without session', async () => {
      mockSessionRepo.findOne.mockResolvedValue(null);
      await service.logout('u1');
      expect(mockActivityLog.log).toHaveBeenCalledWith(expect.objectContaining({ userId: 'u1' }));
    });
  });

  describe('constructor warnings', () => {
    it('should warn when config values missing (lines 30-37)', async () => {
      const m = await Test.createTestingModule({
        providers: [AuthBffService, SessionService, UserSyncService,
          { provide: ConfigService, useValue: { get: jest.fn(() => '') } },
          { provide: getRepositoryToken(AdminUser), useValue: mockUserRepo },
          { provide: getRepositoryToken(AdminSession), useValue: mockSessionRepo },
          { provide: ActivityLogService, useValue: mockActivityLog },
          { provide: EncryptionService, useValue: mockEncryptionService },
          { provide: ConversionsTrackingService, useValue: mockConversionsTracking }],
      }).compile();
      expect(m.get(AuthBffService)).toBeDefined();
    });
  });
});
