import { AdminService } from '../admin.service';

const mockCompanyService = {
  findAllByUser: jest.fn(),
  count: jest.fn(),
};

describe('AdminService', () => {
  let service: AdminService;

  beforeEach(() => {
    service = new AdminService(mockCompanyService as any);
    jest.clearAllMocks();
  });

  describe('getStats', () => {
    const userId = 'user-123';

    it('should return total companies count', async () => {
      mockCompanyService.count.mockResolvedValue(3);

      const result = await service.getStats(userId);

      expect(result).toEqual({ totalCompanies: 3 });
      expect(mockCompanyService.count).toHaveBeenCalledWith(userId);
    });

    it('should return zero when no companies exist', async () => {
      mockCompanyService.count.mockResolvedValue(0);

      const result = await service.getStats(userId);

      expect(result).toEqual({ totalCompanies: 0 });
    });
  });

  describe('getDashboard', () => {
    const userId = 'user-456';

    it('should return stats and recent companies', async () => {
      const companies = [
        { id: 'c1', name: 'Company 1', role: 'owner' },
      ];

      mockCompanyService.count.mockResolvedValue(1);
      mockCompanyService.findAllByUser.mockResolvedValue(companies);

      const result = await service.getDashboard(userId);

      expect(result.stats).toEqual({ totalCompanies: 1 });
      expect(result.recentCompanies).toEqual(companies);
    });

    it('should return empty dashboard when no companies', async () => {
      mockCompanyService.count.mockResolvedValue(0);
      mockCompanyService.findAllByUser.mockResolvedValue([]);

      const result = await service.getDashboard(userId);

      expect(result.stats).toEqual({ totalCompanies: 0 });
      expect(result.recentCompanies).toEqual([]);
    });

    it('should limit recent companies to 5', async () => {
      const companies = Array.from({ length: 10 }, (_, i) => ({
        id: `c${i}`, name: `Company ${i}`, role: 'member',
      }));

      mockCompanyService.count.mockResolvedValue(10);
      mockCompanyService.findAllByUser.mockResolvedValue(companies);

      const result = await service.getDashboard(userId);

      expect(result.recentCompanies).toHaveLength(5);
    });
  });
});
