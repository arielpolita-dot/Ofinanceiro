import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AdminSessionsService } from '../admin-sessions.service';
import { AdminSession } from '../../../database/entities';

const mockRepository = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
};

describe('AdminSessionsService', () => {
  let service: AdminSessionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminSessionsService,
        {
          provide: getRepositoryToken(AdminSession),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AdminSessionsService>(AdminSessionsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and save a new session', async () => {
      const data = {
        adminUserId: 'user-1',
        refreshToken: 'token-abc',
        ipAddress: '1.2.3.4',
        userAgent: 'Chrome',
        expiresAt: new Date('2025-12-31'),
      };
      const session = { id: 'sess-1', ...data };
      mockRepository.create.mockReturnValue(session);
      mockRepository.save.mockResolvedValue(session);

      const result = await service.create(data);

      expect(mockRepository.create).toHaveBeenCalledWith(data);
      expect(mockRepository.save).toHaveBeenCalledWith(session);
      expect(result).toEqual(session);
    });

    it('should create session without optional fields', async () => {
      const data = {
        adminUserId: 'user-2',
        refreshToken: 'token-xyz',
        expiresAt: new Date('2025-12-31'),
      };
      const session = { id: 'sess-2', ...data };
      mockRepository.create.mockReturnValue(session);
      mockRepository.save.mockResolvedValue(session);

      const result = await service.create(data);

      expect(result).toEqual(session);
    });
  });

  describe('findByRefreshToken', () => {
    it('should find active session by refresh token with relations', async () => {
      const session = { id: 'sess-1', refreshToken: 'tok', active: true };
      mockRepository.findOne.mockResolvedValue(session);

      const result = await service.findByRefreshToken('tok');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { refreshToken: 'tok', active: true },
        relations: ['adminUser'],
      });
      expect(result).toEqual(session);
    });

    it('should return null when no active session found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findByRefreshToken('invalid');

      expect(result).toBeNull();
    });
  });

  describe('findByToken', () => {
    it('should find active session by token with relations', async () => {
      const session = { id: 'sess-1' };
      mockRepository.findOne.mockResolvedValue(session);

      const result = await service.findByToken('my-token');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { refreshToken: 'my-token', active: true },
        relations: ['adminUser'],
      });
      expect(result).toEqual(session);
    });

    it('should return null for non-existent token', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findByToken('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByAdminUserId', () => {
    it('should find active sessions ordered by createdAt DESC', async () => {
      const sessions = [{ id: 's1' }, { id: 's2' }];
      mockRepository.find.mockResolvedValue(sessions);

      const result = await service.findByAdminUserId('user-1');

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { adminUserId: 'user-1', active: true },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(sessions);
    });

    it('should return empty array when no sessions found', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findByAdminUserId('user-no-sessions');

      expect(result).toEqual([]);
    });
  });

  describe('revokeSession', () => {
    it('should set active to false for given session id', async () => {
      mockRepository.update.mockResolvedValue({ affected: 1 });

      await service.revokeSession('sess-1');

      expect(mockRepository.update).toHaveBeenCalledWith('sess-1', {
        active: false,
      });
    });
  });

  describe('revokeAllAdminUserSessions', () => {
    it('should deactivate all active sessions for a user', async () => {
      mockRepository.update.mockResolvedValue({ affected: 3 });

      await service.revokeAllAdminUserSessions('user-1');

      expect(mockRepository.update).toHaveBeenCalledWith(
        { adminUserId: 'user-1', active: true },
        { active: false },
      );
    });
  });

  describe('revokeByRefreshToken', () => {
    it('should deactivate session by refresh token', async () => {
      mockRepository.update.mockResolvedValue({ affected: 1 });

      await service.revokeByRefreshToken('tok-abc');

      expect(mockRepository.update).toHaveBeenCalledWith(
        { refreshToken: 'tok-abc' },
        { active: false },
      );
    });
  });

  describe('cleanExpiredSessions', () => {
    it('should delete sessions with expired dates', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 5 });

      await service.cleanExpiredSessions();

      expect(mockRepository.delete).toHaveBeenCalledWith({
        expiresAt: expect.any(Object),
      });
    });
  });

  describe('countActiveSessions', () => {
    it('should return count of active sessions for user', async () => {
      mockRepository.count.mockResolvedValue(3);

      const result = await service.countActiveSessions('user-1');

      expect(mockRepository.count).toHaveBeenCalledWith({
        where: { adminUserId: 'user-1', active: true },
      });
      expect(result).toBe(3);
    });

    it('should return 0 when no active sessions', async () => {
      mockRepository.count.mockResolvedValue(0);

      const result = await service.countActiveSessions('user-no-sessions');

      expect(result).toBe(0);
    });
  });
});
