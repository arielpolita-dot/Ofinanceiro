import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AdminController } from '../admin.controller';
import { AdminService } from '../admin.service';
import { AuthGuard } from '../../../common/guards/auth.guard';

const mockAdminService = {
  getStats: jest.fn(),
  getDashboard: jest.fn(),
};

const mockAuthGuard = { canActivate: jest.fn().mockReturnValue(true) };

describe('AdminController', () => {
  let controller: AdminController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        { provide: AdminService, useValue: mockAdminService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<AdminController>(AdminController);
    jest.clearAllMocks();
  });

  describe('getStats', () => {
    it('should return stats for authenticated user', async () => {
      const statsResult = {
        totalProjects: 5,
        criticalVulns: 1,
        highVulns: 2,
        mediumVulns: 3,
        lowVulns: 4,
        scannedProjects: 3,
        secureProjects: 1,
      };

      mockAdminService.getStats.mockResolvedValue(statsResult);

      const req = { adminUser: { id: 'user-123' } } as any;
      const result = await controller.getStats(req);

      expect(result).toEqual(statsResult);
      expect(mockAdminService.getStats).toHaveBeenCalledWith('user-123');
    });

    it('should throw UnauthorizedException when adminUser is missing', async () => {
      const req = {} as any;

      await expect(controller.getStats(req)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when adminUser.id is missing', async () => {
      const req = { adminUser: {} } as any;

      await expect(controller.getStats(req)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when adminUser is null', async () => {
      const req = { adminUser: null } as any;

      await expect(controller.getStats(req)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when adminUser is undefined', async () => {
      const req = { adminUser: undefined } as any;

      await expect(controller.getStats(req)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('getDashboard', () => {
    it('should return dashboard data for authenticated user', async () => {
      const dashboardResult = {
        stats: { totalProjects: 2 },
        recentProjects: [{ id: 'p1', name: 'Test' }],
      };

      mockAdminService.getDashboard.mockResolvedValue(dashboardResult);

      const req = { adminUser: { id: 'user-456' } } as any;
      const result = await controller.getDashboard(req);

      expect(result).toEqual(dashboardResult);
      expect(mockAdminService.getDashboard).toHaveBeenCalledWith('user-456');
    });

    it('should throw UnauthorizedException when adminUser is missing', async () => {
      const req = {} as any;

      await expect(controller.getDashboard(req)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when adminUser.id is undefined', async () => {
      const req = { adminUser: { id: undefined } } as any;

      await expect(controller.getDashboard(req)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when adminUser.id is empty', async () => {
      const req = { adminUser: { id: '' } } as any;

      await expect(controller.getDashboard(req)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should propagate service errors', async () => {
      mockAdminService.getDashboard.mockRejectedValue(
        new Error('DB connection failed'),
      );

      const req = { adminUser: { id: 'user-789' } } as any;

      await expect(controller.getDashboard(req)).rejects.toThrow(
        'DB connection failed',
      );
    });
  });
});
