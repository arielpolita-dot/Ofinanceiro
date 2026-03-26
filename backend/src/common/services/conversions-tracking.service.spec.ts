import { ConversionsTrackingService } from './conversions-tracking.service';
import * as https from 'https';
import { EventEmitter } from 'events';

jest.mock('https');

describe('ConversionsTrackingService', () => {
  let service: ConversionsTrackingService;
  let mockRequest: EventEmitter & { write: jest.Mock; end: jest.Mock };

  const originalEnv = process.env;

  const createMockConfigService = () => ({
    get: jest.fn((key: string) => {
      return process.env[key] || '';
    }),
    getOrThrow: jest.fn((key: string) => {
      const val = process.env[key];
      if (val) return val;
      throw new Error(`Missing ${key}`);
    }),
  });

  let mockConfigService: ReturnType<typeof createMockConfigService>;

  beforeEach(() => {
    jest.resetAllMocks();
    process.env = {
      ...originalEnv,
      META_PIXEL_ID: 'test-pixel-123',
      META_ACCESS_TOKEN: 'test-token-456',
      META_TEST_EVENT_CODE: undefined,
      FRONTEND_URL: 'https://app.test',
    };

    mockConfigService = createMockConfigService();
    service = new ConversionsTrackingService(mockConfigService as any);

    mockRequest = new EventEmitter() as EventEmitter & { write: jest.Mock; end: jest.Mock };
    mockRequest.write = jest.fn();
    mockRequest.end = jest.fn();

    (https.request as jest.Mock).mockImplementation((_opts, callback) => {
      const mockResponse = new EventEmitter();
      (mockResponse as any).statusCode = 200;
      callback(mockResponse);
      process.nextTick(() => {
        mockResponse.emit('data', '{"events_received":1}');
        mockResponse.emit('end');
      });
      return mockRequest;
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('when disabled (no pixel/token)', () => {
    it('should not send events when pixel ID is missing', async () => {
      process.env.META_PIXEL_ID = '';
      const cfg = createMockConfigService();
      service = new ConversionsTrackingService(cfg as any);

      await service.trackLead({ email: 'test@test.com' });
      expect(https.request).not.toHaveBeenCalled();
    });

    it('should not send events when access token is missing', async () => {
      process.env.META_ACCESS_TOKEN = '';
      const cfg = createMockConfigService();
      service = new ConversionsTrackingService(cfg as any);

      await service.trackLead({ email: 'test@test.com' });
      expect(https.request).not.toHaveBeenCalled();
    });
  });

  describe('trackLead', () => {
    it('should send Lead event with user data', async () => {
      await service.trackLead({ email: 'user@test.com', ip: '1.2.3.4' });

      expect(https.request).toHaveBeenCalledTimes(1);
      const payload = JSON.parse(mockRequest.write.mock.calls[0][0]);
      expect(payload.data[0].event_name).toBe('Lead');
      expect(payload.data[0].action_source).toBe('website');
      expect(payload.data[0].user_data.em).toBeDefined();
      expect(payload.data[0].user_data.client_ip_address).toBe('1.2.3.4');
      expect(payload.data[0].custom_data.content_name).toBe('App Trial Started');
    });

    it('should merge custom data', async () => {
      await service.trackLead({ email: 'u@t.com' }, { extra: 'val' });

      const payload = JSON.parse(mockRequest.write.mock.calls[0][0]);
      expect(payload.data[0].custom_data.extra).toBe('val');
    });

    it('should include test_event_code when configured', async () => {
      process.env.META_TEST_EVENT_CODE = 'TEST123';
      const cfg = createMockConfigService();
      service = new ConversionsTrackingService(cfg as any);

      await service.trackLead({ email: 'u@t.com' });

      const payload = JSON.parse(mockRequest.write.mock.calls[0][0]);
      expect(payload.test_event_code).toBe('TEST123');
    });
  });

  describe('trackCompleteRegistration', () => {
    it('should send CompleteRegistration event', async () => {
      await service.trackCompleteRegistration({
        email: 'user@test.com',
        externalId: 'uid-1',
      });

      const payload = JSON.parse(mockRequest.write.mock.calls[0][0]);
      expect(payload.data[0].event_name).toBe('CompleteRegistration');
      expect(payload.data[0].custom_data.status).toBe('completed');
      expect(payload.data[0].user_data.external_id).toBeDefined();
    });
  });

  describe('trackScanCompleted', () => {
    it('should send StartTrial event with scan results', async () => {
      await service.trackScanCompleted(
        { email: 'u@t.com' },
        { critical: 2, high: 3, medium: 1, low: 0 },
      );

      const payload = JSON.parse(mockRequest.write.mock.calls[0][0]);
      expect(payload.data[0].event_name).toBe('StartTrial');
      expect(payload.data[0].custom_data.vulnerabilities_found).toBe(6);
      expect(payload.data[0].custom_data.critical_count).toBe(2);
    });

    it('should handle undefined scan result fields', async () => {
      await service.trackScanCompleted({ email: 'u@t.com' }, {});

      const payload = JSON.parse(mockRequest.write.mock.calls[0][0]);
      expect(payload.data[0].custom_data.vulnerabilities_found).toBe(0);
    });
  });

  describe('trackPurchase', () => {
    it('should send Purchase event with value', async () => {
      await service.trackPurchase(
        { email: 'u@t.com' },
        99.90,
        'BRL',
        'Pro Plan',
      );

      const payload = JSON.parse(mockRequest.write.mock.calls[0][0]);
      expect(payload.data[0].event_name).toBe('Purchase');
      expect(payload.data[0].custom_data.value).toBe(99.90);
      expect(payload.data[0].custom_data.currency).toBe('BRL');
      expect(payload.data[0].custom_data.content_name).toBe('Pro Plan');
    });

    it('should use defaults when optional params omitted', async () => {
      await service.trackPurchase({ email: 'u@t.com' }, 50);

      const payload = JSON.parse(mockRequest.write.mock.calls[0][0]);
      expect(payload.data[0].custom_data.currency).toBe('BRL');
      expect(payload.data[0].custom_data.content_name).toBe('App Plan');
    });
  });

  describe('trackViewContent', () => {
    it('should send ViewContent event', async () => {
      await service.trackViewContent(
        { email: 'u@t.com' },
        'Pricing Page',
        'https://app.com/pricing',
      );

      const payload = JSON.parse(mockRequest.write.mock.calls[0][0]);
      expect(payload.data[0].event_name).toBe('ViewContent');
      expect(payload.data[0].custom_data.content_name).toBe('Pricing Page');
      expect(payload.data[0].event_source_url).toBe('https://app.com/pricing');
    });

    it('should use default URL when pageUrl not provided', async () => {
      await service.trackViewContent({ email: 'u@t.com' }, 'Page');

      const payload = JSON.parse(mockRequest.write.mock.calls[0][0]);
      expect(payload.data[0].event_source_url).toBe('https://app.test');
    });
  });

  describe('user data building', () => {
    it('should hash email with SHA256', async () => {
      await service.trackLead({ email: 'Test@Example.COM' });

      const payload = JSON.parse(mockRequest.write.mock.calls[0][0]);
      const em = payload.data[0].user_data.em[0];
      expect(em).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should normalize phone with Brazil country code', async () => {
      await service.trackLead({ phone: '11999887766' });

      const payload = JSON.parse(mockRequest.write.mock.calls[0][0]);
      expect(payload.data[0].user_data.ph).toBeDefined();
    });

    it('should not prepend 55 if already present', async () => {
      await service.trackLead({ phone: '5511999887766' });

      const payload = JSON.parse(mockRequest.write.mock.calls[0][0]);
      expect(payload.data[0].user_data.ph).toBeDefined();
    });

    it('should include fbc and fbp cookies', async () => {
      await service.trackLead({ fbc: 'fb.1.123', fbp: 'fb.1.456' });

      const payload = JSON.parse(mockRequest.write.mock.calls[0][0]);
      expect(payload.data[0].user_data.fbc).toBe('fb.1.123');
      expect(payload.data[0].user_data.fbp).toBe('fb.1.456');
    });

    it('should include userAgent', async () => {
      await service.trackLead({ userAgent: 'Mozilla/5.0' });

      const payload = JSON.parse(mockRequest.write.mock.calls[0][0]);
      expect(payload.data[0].user_data.client_user_agent).toBe('Mozilla/5.0');
    });
  });

  describe('empty user data fields', () => {
    it('should handle empty email in user data', async () => {
      await service.trackLead({ email: '' });

      expect(https.request).toHaveBeenCalledTimes(1);
      const payload = JSON.parse(mockRequest.write.mock.calls[0][0]);
      expect(payload.data[0].user_data.em).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('should resolve on request error without throwing', async () => {
      (https.request as jest.Mock).mockImplementation(() => {
        process.nextTick(() => mockRequest.emit('error', new Error('ECONNREFUSED')));
        return mockRequest;
      });

      await expect(service.trackLead({ email: 'u@t.com' })).resolves.toBeUndefined();
    });

    it('should handle non-200 response gracefully', async () => {
      (https.request as jest.Mock).mockImplementation((_opts, callback) => {
        const res = new EventEmitter();
        (res as any).statusCode = 400;
        callback(res);
        process.nextTick(() => {
          res.emit('data', '{"error":"bad request"}');
          res.emit('end');
        });
        return mockRequest;
      });

      await expect(service.trackLead({ email: 'u@t.com' })).resolves.toBeUndefined();
    });
  });
});
