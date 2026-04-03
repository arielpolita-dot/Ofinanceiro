import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { AnalyticsService, TrackEventDto } from '../analytics.service';
import { AnalyticsEvent } from '../../../database/schemas';

const mockModel = {
  create: jest.fn(),
  insertMany: jest.fn(),
  find: jest.fn().mockReturnValue({
    sort: jest.fn().mockReturnValue({ exec: jest.fn() }),
  }),
  aggregate: jest.fn(),
};

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: getModelToken(AnalyticsEvent.name), useValue: mockModel },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    jest.clearAllMocks();

    // Re-setup chained mocks after clearAllMocks
    mockModel.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }),
    });
  });

  describe('track', () => {
    const baseDto: TrackEventDto = {
      sessionId: 'sess-1',
      eventName: 'page_view',
    };

    it('should create an analytics event', async () => {
      const doc = { _id: 'evt-1', ...baseDto };
      mockModel.create.mockResolvedValue(doc);

      const result = await service.track(baseDto, '1.2.3.4', 'Mozilla/5.0');

      expect(mockModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'sess-1',
          eventName: 'page_view',
          ipAddress: '1.2.3.4',
          userAgent: 'Mozilla/5.0',
        }),
      );
      expect(result).toEqual(doc);
    });

    it('should set undefined for optional fields not provided', async () => {
      mockModel.create.mockResolvedValue({ _id: 'evt-2' });

      await service.track(baseDto);

      expect(mockModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          visitorId: undefined,
          eventData: undefined,
          page: undefined,
          referrer: undefined,
          hostname: undefined,
        }),
      );
    });

    it('should extract scanId from eventData when not provided directly', async () => {
      const dto: TrackEventDto = {
        sessionId: 'sess-1',
        eventName: 'scan_complete',
        eventData: { scan_id: 'scan-from-data' },
      };
      mockModel.create.mockResolvedValue({ _id: 'evt-3' });

      await service.track(dto);

      expect(mockModel.create).toHaveBeenCalledWith(
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
      mockModel.create.mockResolvedValue({ _id: 'evt-4' });

      await service.track(dto);

      expect(mockModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ scanId: 'direct-scan' }),
      );
    });

    it('should extract funnelVariant from eventData when not provided', async () => {
      const dto: TrackEventDto = {
        sessionId: 'sess-1',
        eventName: 'funnel_step',
        eventData: { funnel_variant: 'video' },
      };
      mockModel.create.mockResolvedValue({ _id: 'evt-5' });

      await service.track(dto);

      expect(mockModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ funnelVariant: 'video' }),
      );
    });

    it('should propagate and rethrow errors', async () => {
      mockModel.create.mockRejectedValue(new Error('DB write failed'));
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
      mockModel.create.mockResolvedValue({ _id: 'evt-6' });

      await service.track(dto);

      expect(mockModel.create).toHaveBeenCalledWith(
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
    it('should insert multiple events', async () => {
      const events: TrackEventDto[] = [
        { sessionId: 's1', eventName: 'ev1' },
        { sessionId: 's2', eventName: 'ev2' },
      ];
      const docs = [{ _id: '1' }, { _id: '2' }];
      mockModel.insertMany.mockResolvedValue(docs);

      const result = await service.trackBatch(events, '1.1.1.1', 'Agent');

      expect(mockModel.insertMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ sessionId: 's1', eventName: 'ev1' }),
          expect.objectContaining({ sessionId: 's2', eventName: 'ev2' }),
        ]),
      );
      expect(result).toEqual(docs);
    });

    it('should handle empty batch', async () => {
      mockModel.insertMany.mockResolvedValue([]);
      const result = await service.trackBatch([]);
      expect(result).toEqual([]);
    });
  });

  describe('getEventsBySession', () => {
    it('should find events sorted by created_at ASC', async () => {
      const events = [{ _id: '1' }, { _id: '2' }];
      const execMock = jest.fn().mockResolvedValue(events);
      const sortMock = jest.fn().mockReturnValue({ exec: execMock });
      mockModel.find.mockReturnValue({ sort: sortMock });

      const result = await service.getEventsBySession('sess-123');

      expect(mockModel.find).toHaveBeenCalledWith({ sessionId: 'sess-123' });
      expect(sortMock).toHaveBeenCalledWith({ created_at: 1 });
      expect(result).toEqual(events);
    });
  });

  describe('getEventsByScan', () => {
    it('should find events by scanId sorted ASC', async () => {
      const events = [{ _id: '1' }];
      const execMock = jest.fn().mockResolvedValue(events);
      const sortMock = jest.fn().mockReturnValue({ exec: execMock });
      mockModel.find.mockReturnValue({ sort: sortMock });

      const result = await service.getEventsByScan('scan-456');

      expect(mockModel.find).toHaveBeenCalledWith({ scanId: 'scan-456' });
      expect(result).toEqual(events);
    });
  });

  describe('getFunnelStats', () => {
    it('should return aggregated funnel event counts', async () => {
      mockModel.aggregate.mockResolvedValue([
        { _id: 'funnel_start', count: 100 },
        { _id: 'funnel_complete', count: 25 },
      ]);

      const result = await service.getFunnelStats(
        new Date('2024-01-01'),
        new Date('2024-01-31'),
      );

      expect(result).toEqual({ funnel_start: 100, funnel_complete: 25 });
    });

    it('should return empty object when no funnel events', async () => {
      mockModel.aggregate.mockResolvedValue([]);
      const result = await service.getFunnelStats(new Date(), new Date());
      expect(result).toEqual({});
    });
  });

  describe('getConversionStats', () => {
    it('should return aggregated conversion event counts', async () => {
      mockModel.aggregate.mockResolvedValue([
        { _id: 'conversion_signup', count: 50 },
      ]);

      const result = await service.getConversionStats(
        new Date('2024-01-01'),
        new Date('2024-01-31'),
      );

      expect(result).toEqual({ conversion_signup: 50 });
    });

    it('should return empty object when no conversions', async () => {
      mockModel.aggregate.mockResolvedValue([]);
      const result = await service.getConversionStats(new Date(), new Date());
      expect(result).toEqual({});
    });
  });
});
