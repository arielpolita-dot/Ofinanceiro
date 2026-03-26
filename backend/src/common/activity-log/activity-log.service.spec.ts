import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ActivityLogService, LogActivityParams } from './activity-log.service';
import { ActivityLog, ActivityAction, ActivityResource } from '../../database/entities';

describe('ActivityLogService', () => {
  let service: ActivityLogService;
  let mockRepo: Record<string, jest.Mock>;

  const mockActivity: Partial<ActivityLog> = {
    id: 'act-1', userId: 'user-1', userEmail: 'u@t.com',
    action: ActivityAction.LOGIN, resourceType: ActivityResource.AUTH,
    success: true, createdAt: new Date(),
  };

  beforeEach(async () => {
    mockRepo = {
      create: jest.fn().mockReturnValue(mockActivity),
      save: jest.fn().mockResolvedValue(mockActivity),
      find: jest.fn().mockResolvedValue([mockActivity]),
      findOne: jest.fn().mockResolvedValue(mockActivity),
      findAndCount: jest.fn().mockResolvedValue([[mockActivity], 1]),
      createQueryBuilder: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(), addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(), andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(), addGroupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(), limit: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
        execute: jest.fn().mockResolvedValue({ affected: 5 }),
      }),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityLogService,
        { provide: getRepositoryToken(ActivityLog), useValue: mockRepo },
      ],
    }).compile();
    service = module.get<ActivityLogService>(ActivityLogService);
  });

  describe('log', () => {
    it('should create and save an activity log', async () => {
      const params: LogActivityParams = {
        userId: 'user-1', userEmail: 'u@t.com',
        action: ActivityAction.LOGIN, resourceType: ActivityResource.AUTH,
      };
      const result = await service.log(params);
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1', action: ActivityAction.LOGIN, success: true }),
      );
      expect(mockRepo.save).toHaveBeenCalled();
      expect(result).toEqual(mockActivity);
    });

    it('should handle null/undefined optional fields', async () => {
      await service.log({ action: ActivityAction.FRONTEND_EVENT, resourceType: ActivityResource.FRONTEND });
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: null, userEmail: null, resourceId: null, resourceName: null,
          ipAddress: null, userAgent: null, sessionId: null, metadata: null,
          errorMessage: null, durationMs: null,
        }),
      );
    });

    it('should truncate userAgent to 500 chars', async () => {
      const longUA = 'x'.repeat(600);
      await service.log({ action: ActivityAction.LOGIN, resourceType: ActivityResource.AUTH, userAgent: longUA });
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ userAgent: longUA.substring(0, 500) }),
      );
    });

    it('should return null and not throw on save error', async () => {
      mockRepo.save.mockRejectedValue(new Error('DB error'));
      const result = await service.log({ action: ActivityAction.LOGIN, resourceType: ActivityResource.AUTH });
      expect(result).toBeNull();
    });

    it('should default success to true', async () => {
      await service.log({ action: ActivityAction.LOGIN, resourceType: ActivityResource.AUTH });
      expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should use explicit success=false', async () => {
      await service.log({ action: ActivityAction.LOGIN_FAILED, resourceType: ActivityResource.AUTH, success: false });
      expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });
  });

  describe('findAll', () => {
    it('should query with default limit/offset', async () => {
      const result = await service.findAll();
      expect(mockRepo.findAndCount).toHaveBeenCalledWith(expect.objectContaining({ take: 50, skip: 0 }));
      expect(result.total).toBe(1);
      expect(result.activities).toHaveLength(1);
    });

    it('should apply all filters', async () => {
      await service.findAll({
        userId: 'u1', action: ActivityAction.LOGIN, resourceType: ActivityResource.AUTH,
        resourceId: 'r1', ipAddress: '1.2.3.4', success: true,
        startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31'),
        limit: 10, offset: 5,
      });
      expect(mockRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'u1', resourceId: 'r1', ipAddress: '1.2.3.4', success: true }),
          take: 10, skip: 5,
        }),
      );
    });

    it('should handle array of actions with In operator', async () => {
      await service.findAll({ action: [ActivityAction.LOGIN, ActivityAction.LOGOUT] });
      expect(mockRepo.findAndCount).toHaveBeenCalled();
    });

    it('should handle startDate only', async () => {
      await service.findAll({ startDate: new Date() });
      expect(mockRepo.findAndCount).toHaveBeenCalled();
    });

    it('should handle endDate only', async () => {
      await service.findAll({ endDate: new Date() });
      expect(mockRepo.findAndCount).toHaveBeenCalled();
    });
  });

  describe('findByUser', () => {
    it('should find by userId with default limit', async () => {
      await service.findByUser('user-1');
      expect(mockRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-1' }, take: 50 }),
      );
    });
  });

  describe('findByResource', () => {
    it('should find by resource type and id with custom limit', async () => {
      await service.findByResource(ActivityResource.AUTH, 'res-1', 10);
      expect(mockRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { resourceType: ActivityResource.AUTH, resourceId: 'res-1' }, take: 10 }),
      );
    });

    it('should use default limit of 50 (line 133)', async () => {
      await service.findByResource(ActivityResource.AUTH, 'res-1');
      expect(mockRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ take: 50 }),
      );
    });
  });

  describe('getLastLogin', () => {
    it('should find last login for user', async () => {
      await service.getLastLogin('user-1');
      expect(mockRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-1', action: ActivityAction.LOGIN, success: true } }),
      );
    });
  });

  describe('getFailedLogins', () => {
    it('should find failed logins with filters', async () => {
      await service.getFailedLogins({ email: 'u@t.com', ipAddress: '1.2.3.4' });
      expect(mockRepo.find).toHaveBeenCalled();
    });
  });

  describe('getRecentActivities', () => {
    it('should return recent activities with default limit', async () => {
      const result = await service.getRecentActivities();
      expect(mockRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ relations: ['user'], order: { createdAt: 'DESC' }, take: 100 }),
      );
      expect(result).toEqual([mockActivity]);
    });

    it('should accept custom limit', async () => {
      await service.getRecentActivities(10);
      expect(mockRepo.find).toHaveBeenCalledWith(expect.objectContaining({ take: 10 }));
    });
  });

  describe('getTodayActivities', () => {
    it('should return activities from today', async () => {
      const result = await service.getTodayActivities();
      expect(mockRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ relations: ['user'], order: { createdAt: 'DESC' } }),
      );
      expect(result).toEqual([mockActivity]);
    });
  });

  describe('getStats', () => {
    it('should compute stats from activities', async () => {
      mockRepo.find.mockResolvedValue([
        { action: 'login', resourceType: 'auth', success: true },
        { action: 'login', resourceType: 'auth', success: false },
        { action: 'logout', resourceType: 'auth', success: true },
      ]);
      const stats = await service.getStats({ startDate: new Date(), endDate: new Date() });
      expect(stats.totalActions).toBe(3);
      expect(stats.byAction['login']).toBe(2);
      expect(stats.failedActions).toBe(1);
    });
  });

  describe('countByAction', () => {
    it('should return counts grouped by action', async () => {
      const qb = mockRepo.createQueryBuilder();
      qb.getRawMany.mockResolvedValue([{ action: 'LOGIN', count: '5' }, { action: 'LOGOUT', count: '3' }]);
      const result = await service.countByAction(new Date(), new Date());
      expect(result).toEqual({ LOGIN: 5, LOGOUT: 3 });
    });
  });

  describe('countByUser', () => {
    it('should return counts grouped by user', async () => {
      const qb = mockRepo.createQueryBuilder();
      qb.getRawMany.mockResolvedValue([{ userId: 'u1', userEmail: 'a@b.c', count: '10' }]);
      const result = await service.countByUser(new Date(), new Date());
      expect(result).toEqual([{ userId: 'u1', userEmail: 'a@b.c', count: 10 }]);
    });
  });

  describe('cleanOldLogs', () => {
    it('should delete logs older than retention days', async () => {
      const result = await service.cleanOldLogs(30);
      expect(result).toBe(5);
    });

    it('should return 0 when affected is null/undefined (line 268)', async () => {
      const qb = mockRepo.createQueryBuilder();
      qb.execute.mockResolvedValue({ affected: null });
      const result = await service.cleanOldLogs();
      expect(result).toBe(0);
    });
  });

  describe('log - debug message branches', () => {
    it('should include resourceId in debug message when present (line 75)', async () => {
      await service.log({
        action: ActivityAction.LOGIN, resourceType: ActivityResource.AUTH,
        resourceId: 'res-123', userId: 'u1',
      });
      expect(mockRepo.save).toHaveBeenCalled();
    });

    it('should show anonymous when no userId or email (line 76)', async () => {
      await service.log({ action: ActivityAction.FRONTEND_EVENT, resourceType: ActivityResource.FRONTEND });
      expect(mockRepo.save).toHaveBeenCalled();
    });
  });

  describe('getFailedLogins - partial params', () => {
    it('should filter by email only (line 160)', async () => {
      await service.getFailedLogins({ email: 'u@t.com' });
      expect(mockRepo.find).toHaveBeenCalled();
    });

    it('should filter by ipAddress only (line 161)', async () => {
      await service.getFailedLogins({ ipAddress: '1.2.3.4' });
      expect(mockRepo.find).toHaveBeenCalled();
    });

    it('should filter by since only (line 162)', async () => {
      await service.getFailedLogins({ since: new Date() });
      expect(mockRepo.find).toHaveBeenCalled();
    });

    it('should work with no params (line 155)', async () => {
      await service.getFailedLogins({});
      expect(mockRepo.find).toHaveBeenCalled();
    });
  });

  describe('getStats - userId filter', () => {
    it('should filter by userId when provided (line 199)', async () => {
      mockRepo.find.mockResolvedValue([]);
      const stats = await service.getStats({
        userId: 'u1', startDate: new Date(), endDate: new Date(),
      });
      expect(stats.totalActions).toBe(0);
    });
  });
});
