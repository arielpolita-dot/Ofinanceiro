import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from '../analytics.controller';
import { AnalyticsService } from '../analytics.service';

const mockAnalyticsService = {
  track: jest.fn(),
  trackBatch: jest.fn(),
};

describe('AnalyticsController', () => {
  let controller: AnalyticsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        { provide: AnalyticsService, useValue: mockAnalyticsService },
      ],
    }).compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
    jest.clearAllMocks();
  });

  const makeReq = (overrides: Partial<any> = {}) =>
    ({
      headers: { 'user-agent': 'TestAgent/1.0' },
      ip: '127.0.0.1',
      socket: { remoteAddress: '10.0.0.1' },
      ...overrides,
    }) as any;

  describe('track', () => {
    it('should track a single event and return success', async () => {
      mockAnalyticsService.track.mockResolvedValue({ id: 'evt-1' });

      const body = {
        sessionId: 'sess-1',
        eventName: 'page_view',
        page: '/home',
      };
      const req = makeReq();

      const result = await controller.track(body, req);

      expect(result).toEqual({ success: true });
      expect(mockAnalyticsService.track).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'sess-1',
          eventName: 'page_view',
          page: '/home',
        }),
        '127.0.0.1',
        'TestAgent/1.0',
      );
    });

    it('should map UTM params from nested utm object', async () => {
      mockAnalyticsService.track.mockResolvedValue({ id: 'evt-2' });

      const body = {
        sessionId: 'sess-1',
        eventName: 'page_view',
        utm: {
          source: 'google',
          medium: 'cpc',
          campaign: 'summer',
          content: 'banner',
          term: 'audit',
        },
      };

      await controller.track(body, makeReq());

      expect(mockAnalyticsService.track).toHaveBeenCalledWith(
        expect.objectContaining({
          utmSource: 'google',
          utmMedium: 'cpc',
          utmCampaign: 'summer',
          utmContent: 'banner',
          utmTerm: 'audit',
        }),
        expect.any(String),
        expect.any(String),
      );
    });

    it('should map screen dimensions from nested screen object', async () => {
      mockAnalyticsService.track.mockResolvedValue({ id: 'evt-3' });

      const body = {
        sessionId: 'sess-1',
        eventName: 'page_view',
        screen: { width: 1920, height: 1080 },
      };

      await controller.track(body, makeReq());

      expect(mockAnalyticsService.track).toHaveBeenCalledWith(
        expect.objectContaining({
          screenWidth: 1920,
          screenHeight: 1080,
        }),
        expect.any(String),
        expect.any(String),
      );
    });

    it('should extract IP from x-forwarded-for header (string)', async () => {
      mockAnalyticsService.track.mockResolvedValue({ id: 'evt-4' });

      const body = { sessionId: 'sess-1', eventName: 'ev' };
      const req = makeReq({
        headers: {
          'x-forwarded-for': '203.0.113.50, 70.41.3.18',
          'user-agent': 'Bot',
        },
      });

      await controller.track(body, req);

      expect(mockAnalyticsService.track).toHaveBeenCalledWith(
        expect.any(Object),
        '203.0.113.50',
        'Bot',
      );
    });

    it('should extract IP from x-forwarded-for header (array)', async () => {
      mockAnalyticsService.track.mockResolvedValue({ id: 'evt-5' });

      const body = { sessionId: 'sess-1', eventName: 'ev' };
      const req = makeReq({
        headers: {
          'x-forwarded-for': ['203.0.113.99', '10.0.0.1'],
          'user-agent': 'Bot',
        },
      });

      await controller.track(body, req);

      expect(mockAnalyticsService.track).toHaveBeenCalledWith(
        expect.any(Object),
        '203.0.113.99',
        'Bot',
      );
    });

    it('should fall back to req.ip when no x-forwarded-for', async () => {
      mockAnalyticsService.track.mockResolvedValue({ id: 'evt-6' });

      const body = { sessionId: 'sess-1', eventName: 'ev' };
      const req = makeReq({
        headers: { 'user-agent': 'Bot' },
        ip: '192.168.1.1',
      });

      await controller.track(body, req);

      expect(mockAnalyticsService.track).toHaveBeenCalledWith(
        expect.any(Object),
        '192.168.1.1',
        'Bot',
      );
    });

    it('should fall back to socket.remoteAddress when no ip', async () => {
      mockAnalyticsService.track.mockResolvedValue({ id: 'evt-7' });

      const body = { sessionId: 'sess-1', eventName: 'ev' };
      const req = makeReq({
        headers: { 'user-agent': 'Bot' },
        ip: undefined,
        socket: { remoteAddress: '10.10.10.10' },
      });

      await controller.track(body, req);

      expect(mockAnalyticsService.track).toHaveBeenCalledWith(
        expect.any(Object),
        '10.10.10.10',
        'Bot',
      );
    });

    it('should return "unknown" when no IP source available', async () => {
      mockAnalyticsService.track.mockResolvedValue({ id: 'evt-8' });

      const body = { sessionId: 'sess-1', eventName: 'ev' };
      const req = makeReq({
        headers: { 'user-agent': 'Bot' },
        ip: undefined,
        socket: { remoteAddress: undefined },
      });

      await controller.track(body, req);

      expect(mockAnalyticsService.track).toHaveBeenCalledWith(
        expect.any(Object),
        'unknown',
        'Bot',
      );
    });

    it('should handle missing utm and screen objects', async () => {
      mockAnalyticsService.track.mockResolvedValue({ id: 'evt-9' });

      const body = { sessionId: 'sess-1', eventName: 'ev' };
      await controller.track(body, makeReq());

      expect(mockAnalyticsService.track).toHaveBeenCalledWith(
        expect.objectContaining({
          utmSource: undefined,
          screenWidth: undefined,
        }),
        expect.any(String),
        expect.any(String),
      );
    });
  });

  describe('trackBatch', () => {
    it('should track batch of events and return count', async () => {
      mockAnalyticsService.trackBatch.mockResolvedValue([
        { id: '1' },
        { id: '2' },
      ]);

      const body = {
        events: [
          { sessionId: 's1', eventName: 'ev1' },
          { sessionId: 's2', eventName: 'ev2' },
        ],
      };

      const result = await controller.trackBatch(body, makeReq());

      expect(result).toEqual({ success: true, count: 2 });
      expect(mockAnalyticsService.trackBatch).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ sessionId: 's1', eventName: 'ev1' }),
          expect.objectContaining({ sessionId: 's2', eventName: 'ev2' }),
        ]),
        '127.0.0.1',
        'TestAgent/1.0',
      );
    });

    it('should map UTM and screen for each batch event', async () => {
      mockAnalyticsService.trackBatch.mockResolvedValue([{ id: '1' }]);

      const body = {
        events: [
          {
            sessionId: 's1',
            eventName: 'ev1',
            utm: { source: 'fb' },
            screen: { width: 800, height: 600 },
          },
        ],
      };

      await controller.trackBatch(body, makeReq());

      expect(mockAnalyticsService.trackBatch).toHaveBeenCalledWith(
        [
          expect.objectContaining({
            utmSource: 'fb',
            screenWidth: 800,
            screenHeight: 600,
          }),
        ],
        expect.any(String),
        expect.any(String),
      );
    });
  });
});
