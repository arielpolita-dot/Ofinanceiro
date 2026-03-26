import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AnalyticsService, TrackEventDto } from '../analytics.service';
import { AnalyticsEvent } from '../../../database/entities/analytics-event.entity';

const mockQueryBuilder = {
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  getRawMany: jest.fn(),
};

const mockRepository = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
};

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: getRepositoryToken(AnalyticsEvent, 'audit'),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    jest.clearAllMocks();
  });

  describe('track', () => {
    const baseDto: TrackEventDto = {
      sessionId: 'sess-1',
      eventName: 'page_view',
    };

    it('should create and save an analytics event', async () => {
      const entity = { id: 'evt-1', ...baseDto };
      mockRepository.create.mockReturnValue(entity);
      mockRepository.save.mockResolvedValue(entity);

      const result = await service.track(baseDto, '1.2.3.4', 'Mozilla/5.0');

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'sess-1',
          eventName: 'page_view',
          ipAddress: '1.2.3.4',
          userAgent: 'Mozilla/5.0',
        }),
      );
      expect(mockRepository.save).toHaveBeenCalledWith(entity);
      expect(result).toEqual(entity);
    });

    it('should set null for optional fields not provided', async () => {
      const entity = { id: 'evt-2' };
      mockRepository.create.mockReturnValue(entity);
      mockRepository.save.mockResolvedValue(entity);

      await service.track(baseDto);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          visitorId: null,
          eventData: null,
          page: null,
          referrer: null,
          hostname: null,
          scanId: null,
          funnelVariant: null,
          utmSource: null,
          ipAddress: null,
          userAgent: null,
        }),
      );
    });

    it('should extract scanId from eventData when not provided directly', async () => {
      const dto: TrackEventDto = {
        sessionId: 'sess-1',
        eventName: 'scan_complete',
        eventData: { scan_id: 'scan-from-data' },
      };
      const entity = { id: 'evt-3' };
      mockRepository.create.mockReturnValue(entity);
      mockRepository.save.mockResolvedValue(entity);

      await service.track(dto);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ scanId: 'scan-from-data' }),
      );
    });

    it('should prefer direct scanId over eventData.scan_id', async () => {
      const dto: TrackEventDto = {
        sessionId: 'sess-1',
        eventName: 'scan',
        scanId: 'direct-scan',
        eventData: { scan_id: 'data-scan' },
      };
      const entity = { id: 'evt-4' };
      mockRepository.create.mockReturnValue(entity);
      mockRepository.save.mockResolvedValue(entity);

      await service.track(dto);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ scanId: 'direct-scan' }),
      );
    });

    it('should extract funnelVariant from eventData when not provided', async () => {
      const dto: TrackEventDto = {
        sessionId: 'sess-1',
        eventName: 'funnel_step',
        eventData: { funnel_variant: 'video' },
      };
      const entity = { id: 'evt-5' };
      mockRepository.create.mockReturnValue(entity);
      mockRepository.save.mockResolvedValue(entity);

      await service.track(dto);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ funnelVariant: 'video' }),
      );
    });

    it('should propagate and rethrow errors from save', async () => {
      mockRepository.create.mockReturnValue({});
      mockRepository.save.mockRejectedValue(new Error('DB write failed'));

      await expect(service.track(baseDto)).rejects.toThrow('DB write failed');
    });

    it('should map all UTM fields', async () => {
      const dto: TrackEventDto = {
        sessionId: 'sess-1',
        eventName: 'page_view',
        utmSource: 'google',
        utmMedium: 'cpc',
        utmCampaign: 'summer',
        utmContent: 'banner',
        utmTerm: 'audit',
      };
      const entity = { id: 'evt-6' };
      mockRepository.create.mockReturnValue(entity);
      mockRepository.save.mockResolvedValue(entity);

      await service.track(dto);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          utmSource: 'google',
          utmMedium: 'cpc',
          utmCampaign: 'summer',
          utmContent: 'banner',
          utmTerm: 'audit',
        }),
      );
    });
  });

  describe('trackBatch', () => {
    it('should create and save multiple events', async () => {
      const events: TrackEventDto[] = [
        { sessionId: 's1', eventName: 'ev1' },
        { sessionId: 's2', eventName: 'ev2' },
      ];
      const entities = [{ id: '1' }, { id: '2' }];
      mockRepository.create
        .mockReturnValueOnce(entities[0])
        .mockReturnValueOnce(entities[1]);
      mockRepository.save.mockResolvedValue(entities);

      const result = await service.trackBatch(events, '1.1.1.1', 'Agent');

      expect(mockRepository.create).toHaveBeenCalledTimes(2);
      expect(mockRepository.save).toHaveBeenCalledWith(entities);
      expect(result).toEqual(entities);
    });

    it('should handle empty batch', async () => {
      mockRepository.save.mockResolvedValue([]);

      const result = await service.trackBatch([]);

      expect(mockRepository.create).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should set null for optional ipAddress and userAgent (lines 106-107)', async () => {
      const events: TrackEventDto[] = [{ sessionId: 's1', eventName: 'ev1' }];
      const entity = { id: '1' };
      mockRepository.create.mockReturnValue(entity);
      mockRepository.save.mockResolvedValue([entity]);

      await service.trackBatch(events);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ userAgent: null, ipAddress: null }),
      );
    });
  });

  describe('getEventsBySession', () => {
    it('should find events ordered by createdAt ASC', async () => {
      const events = [{ id: '1' }, { id: '2' }];
      mockRepository.find.mockResolvedValue(events);

      const result = await service.getEventsBySession('sess-123');

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { sessionId: 'sess-123' },
        order: { createdAt: 'ASC' },
      });
      expect(result).toEqual(events);
    });
  });

  describe('getEventsByScan', () => {
    it('should find events by scanId ordered ASC', async () => {
      const events = [{ id: '1' }];
      mockRepository.find.mockResolvedValue(events);

      const result = await service.getEventsByScan('scan-456');

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { scanId: 'scan-456' },
        order: { createdAt: 'ASC' },
      });
      expect(result).toEqual(events);
    });
  });

  describe('getFunnelStats', () => {
    it('should return aggregated funnel event counts', async () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-31');
      mockQueryBuilder.getRawMany.mockResolvedValue([
        { eventName: 'funnel_start', count: '100' },
        { eventName: 'funnel_complete', count: '25' },
      ]);

      const result = await service.getFunnelStats(start, end);

      expect(result).toEqual({
        funnel_start: 100,
        funnel_complete: 25,
      });
    });

    it('should return empty object when no funnel events', async () => {
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      const result = await service.getFunnelStats(new Date(), new Date());

      expect(result).toEqual({});
    });
  });

  describe('getConversionStats', () => {
    it('should return aggregated conversion event counts', async () => {
      mockQueryBuilder.getRawMany.mockResolvedValue([
        { eventName: 'conversion_signup', count: '50' },
      ]);

      const result = await service.getConversionStats(
        new Date('2024-01-01'),
        new Date('2024-01-31'),
      );

      expect(result).toEqual({ conversion_signup: 50 });
    });

    it('should return empty object when no conversions', async () => {
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      const result = await service.getConversionStats(new Date(), new Date());

      expect(result).toEqual({});
    });
  });
});
