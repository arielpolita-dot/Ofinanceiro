import { Test, TestingModule } from '@nestjs/testing';
import { ActivityLogController } from './activity-log.controller';
import { ActivityLogService } from './activity-log.service';
import { AuthGuard } from '../guards/auth.guard';
import { OptionalAuthGuard } from '../guards/optional-auth.guard';
import { ActivityAction, ActivityResource } from '../../database/entities';

describe('ActivityLogController', () => {
  let controller: ActivityLogController;
  let mockService: Record<string, jest.Mock>;

  const mockActivities = [
    { id: 'a1', action: ActivityAction.LOGIN, success: true },
  ];

  const alwaysTrueGuard = { canActivate: () => true };

  const createReq = (overrides: Record<string, unknown> = {}) => ({
    user: { id: 'admin-1', email: 'admin@test.com', role: 'admin' },
    ...overrides,
  });

  beforeEach(async () => {
    mockService = {
      findAll: jest.fn().mockResolvedValue({ activities: mockActivities, total: 1 }),
      findByUser: jest.fn().mockResolvedValue(mockActivities),
      getRecentActivities: jest.fn().mockResolvedValue(mockActivities),
      getTodayActivities: jest.fn().mockResolvedValue(mockActivities),
      getStats: jest.fn().mockResolvedValue({
        totalActions: 10, byAction: {}, byResource: {}, failedActions: 1,
      }),
      countByAction: jest.fn().mockResolvedValue({ login: 5 }),
      countByUser: jest.fn().mockResolvedValue([]),
      getFailedLogins: jest.fn().mockResolvedValue([]),
      log: jest.fn().mockResolvedValue({ id: 'log-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActivityLogController],
      providers: [
        { provide: ActivityLogService, useValue: mockService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(alwaysTrueGuard)
      .overrideGuard(OptionalAuthGuard)
      .useValue(alwaysTrueGuard)
      .compile();

    controller = module.get<ActivityLogController>(ActivityLogController);
  });

  describe('GET /activity', () => {
    it('should return activities with meta', async () => {
      const req = createReq();
      const result = await controller.getActivities(req as any);
      expect(result.data).toEqual(mockActivities);
      expect(result.meta.total).toBe(1);
      expect(result.meta.limit).toBe(50);
      expect(result.meta.offset).toBe(0);
    });

    it('should parse limit and offset', async () => {
      const req = createReq();
      await controller.getActivities(
        req as any,
        undefined, undefined, undefined, undefined,
        undefined, undefined, undefined, '10', '5',
      );
      expect(mockService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 10, offset: 5 }),
      );
    });

    it('should parse comma-separated actions', async () => {
      const req = createReq();
      await controller.getActivities(req as any, undefined, 'login,logout');
      expect(mockService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ action: ['login', 'logout'] }),
      );
    });

    it('should parse single action', async () => {
      const req = createReq();
      await controller.getActivities(req as any, undefined, 'login');
      expect(mockService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'login' }),
      );
    });

    it('should parse success as boolean', async () => {
      const req = createReq();
      await controller.getActivities(
        req as any,
        undefined, undefined, undefined, undefined, 'true',
      );
      expect(mockService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ success: true }),
      );
    });

    it('should parse dates', async () => {
      const req = createReq();
      await controller.getActivities(
        req as any,
        undefined, undefined, undefined, undefined,
        undefined, '2024-01-01', '2024-12-31',
      );
      const params = mockService.findAll.mock.calls[0][0];
      expect(params.startDate).toBeInstanceOf(Date);
      expect(params.endDate).toBeInstanceOf(Date);
    });
  });

  describe('GET /activity/me', () => {
    it('should return user activities', async () => {
      const req = createReq({ user: { id: 'u1', email: 'u@t.com' } });
      const result = await controller.getMyActivities(req as any);
      expect(mockService.findByUser).toHaveBeenCalledWith('u1', 50);
      expect(result.data).toEqual(mockActivities);
    });

    it('should return empty when no user', async () => {
      const result = await controller.getMyActivities({} as any);
      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });

    it('should parse custom limit', async () => {
      const req = createReq({ user: { id: 'u1' } });
      await controller.getMyActivities(req as any, '20');
      expect(mockService.findByUser).toHaveBeenCalledWith('u1', 20);
    });
  });

  describe('GET /activity/recent', () => {
    it('should return recent activities with default limit', async () => {
      const req = createReq();
      const result = await controller.getRecentActivities(req as any);
      expect(mockService.getRecentActivities).toHaveBeenCalledWith(100, undefined);
      expect(result.data).toEqual(mockActivities);
    });

    it('should parse custom limit', async () => {
      const req = createReq();
      await controller.getRecentActivities(req as any, '25');
      expect(mockService.getRecentActivities).toHaveBeenCalledWith(25, undefined);
    });
  });

  describe('GET /activity/today', () => {
    it('should return today activities', async () => {
      const req = createReq();
      const result = await controller.getTodayActivities(req as any);
      expect(mockService.getTodayActivities).toHaveBeenCalled();
      expect(result.data).toEqual(mockActivities);
    });
  });

  describe('GET /activity/stats', () => {
    it('should return stats with default 30-day window', async () => {
      const req = createReq();
      const result = await controller.getStats(req as any);
      expect(mockService.getStats).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: expect.any(Date),
          endDate: expect.any(Date),
        }),
      );
      expect(result.totalActions).toBe(10);
    });

    it('should use provided dates and userId', async () => {
      const req = createReq();
      await controller.getStats(req as any, 'u1', '2024-01-01', '2024-12-31');
      expect(mockService.getStats).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'u1' }),
      );
    });
  });

  describe('GET /activity/count-by-action', () => {
    it('should return counts', async () => {
      const req = createReq();
      const result = await controller.getCountByAction(req as any);
      expect(mockService.countByAction).toHaveBeenCalled();
      expect(result).toEqual({ login: 5 });
    });
  });

  describe('GET /activity/count-by-user', () => {
    it('should return user counts', async () => {
      const req = createReq();
      const result = await controller.getCountByUser(req as any);
      expect(mockService.countByUser).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('GET /activity/failed-logins', () => {
    it('should return failed logins with default since', async () => {
      const req = createReq();
      const result = await controller.getFailedLogins(req as any);
      expect(mockService.getFailedLogins).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should pass email and ipAddress filters', async () => {
      const req = createReq();
      await controller.getFailedLogins(req as any, 'u@t.com', '10.0.0.1');
      expect(mockService.getFailedLogins).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'u@t.com', ipAddress: '10.0.0.1' }),
      );
    });

    it('should parse since date when provided', async () => {
      const req = createReq();
      await controller.getFailedLogins(req as any, undefined, undefined, '2024-06-01');
      const params = mockService.getFailedLogins.mock.calls[0][0];
      expect(params.since).toBeInstanceOf(Date);
    });
  });

  describe('GET /activity/count-by-action with dates', () => {
    it('should parse provided dates', async () => {
      const req = createReq();
      await controller.getCountByAction(req as any, '2024-01-01', '2024-12-31');
      expect(mockService.countByAction).toHaveBeenCalled();
    });
  });

  describe('GET /activity/count-by-user with dates', () => {
    it('should parse provided dates', async () => {
      const req = createReq();
      await controller.getCountByUser(req as any, '2024-01-01', '2024-12-31');
      expect(mockService.countByUser).toHaveBeenCalled();
    });
  });

  describe('POST /activity/track', () => {
    it('should log tracked event for authenticated user', async () => {
      const dto = { eventName: 'auth_login', pageUrl: '/login' } as any;
      const req = createReq({ user: { id: 'u1', email: 'u@t.com' } });

      const result = await controller.trackEvent(dto, req as any, '1.2.3.4', 'Mozilla');

      expect(mockService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'u1',
          userEmail: 'u@t.com',
          ipAddress: '1.2.3.4',
          userAgent: 'Mozilla',
        }),
      );
      expect(result).toEqual({ success: true });
    });

    it('should log tracked event for anonymous user', async () => {
      const dto = { eventName: 'funnel_trial_page_view' } as any;
      await controller.trackEvent(dto, {} as any, '1.2.3.4');

      expect(mockService.log).toHaveBeenCalledWith(
        expect.objectContaining({ userId: null, userEmail: null }),
      );
    });
  });

  describe('POST /activity/track/pageview', () => {
    it('should log page view', async () => {
      const dto = { pageName: 'Dashboard', pageUrl: '/dashboard' } as any;
      const req = createReq({ user: { id: 'u1', email: 'u@t.com' } });

      const result = await controller.trackPageView(dto, req as any, '1.2.3.4', 'Chrome');

      expect(mockService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: ActivityAction.NAV_PAGE_VIEW,
          resourceType: ActivityResource.NAVIGATION,
          resourceName: 'Dashboard',
        }),
      );
      expect(result).toEqual({ success: true });
    });

    it('should handle missing pageUrl', async () => {
      const dto = { pageName: 'Home' } as any;
      await controller.trackPageView(dto, {} as any, '::1');

      expect(mockService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            details: expect.objectContaining({ pageUrl: null }),
          }),
        }),
      );
    });
  });
});
