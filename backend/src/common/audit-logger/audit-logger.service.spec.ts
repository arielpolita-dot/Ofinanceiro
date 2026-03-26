import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuditLoggerService } from './audit-logger.service';
import {
  ProjectAuditLog, AuditLogLevel, AuditLogEventType,
} from '../../database/entities/project-audit-log.entity';

describe('AuditLoggerService', () => {
  let service: AuditLoggerService;
  let mockRepo: Record<string, jest.Mock>;
  const mockLog: Partial<ProjectAuditLog> = {
    id: 'log-1', level: AuditLogLevel.INFO,
    eventType: AuditLogEventType.REQUEST_START, message: 'test',
  };

  beforeEach(async () => {
    mockRepo = {
      create: jest.fn().mockReturnValue(mockLog),
      save: jest.fn().mockResolvedValue(mockLog),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLoggerService,
        { provide: getRepositoryToken(ProjectAuditLog, 'audit'), useValue: mockRepo },
      ],
    }).compile();
    service = module.get<AuditLoggerService>(AuditLoggerService);
  });

  describe('generateRequestId', () => {
    it('should return a valid UUID', () => {
      const id = service.generateRequestId();
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    });

    it('should generate unique IDs', () => {
      const ids = new Set(Array.from({ length: 10 }, () => service.generateRequestId()));
      expect(ids.size).toBe(10);
    });
  });

  describe('log', () => {
    it('should create and save audit log', async () => {
      const result = await service.log({
        eventType: AuditLogEventType.REQUEST_START, message: 'GET /api/test',
      });
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          level: AuditLogLevel.INFO, eventType: AuditLogEventType.REQUEST_START,
          message: 'GET /api/test',
        }),
      );
      expect(mockRepo.save).toHaveBeenCalled();
      expect(result).toEqual(mockLog);
    });

    it('should sanitize sensitive params', async () => {
      await service.log({
        eventType: AuditLogEventType.REQUEST_START,
        params: { username: 'john', password: 'secret123' },
      });
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({ username: 'john', password: '[REDACTED]' }),
        }),
      );
    });

    it('should sanitize sensitive result fields', async () => {
      await service.log({
        eventType: AuditLogEventType.REQUEST_END,
        result: { data: 'ok', token: 'abc' },
      });
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ result: expect.objectContaining({ token: '[REDACTED]' }) }),
      );
    });

    it('should truncate errorStack to 5000 and userAgent to 500 chars', async () => {
      await service.log({
        eventType: AuditLogEventType.REQUEST_ERROR,
        errorStack: 'x'.repeat(6000), userAgent: 'u'.repeat(600),
      });
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          errorStack: 'x'.repeat(5000), userAgent: 'u'.repeat(500),
        }),
      );
    });

    it('should return null on save error', async () => {
      mockRepo.save.mockRejectedValue(new Error('DB down'));
      const result = await service.log({ eventType: AuditLogEventType.SYSTEM_ERROR });
      expect(result).toBeNull();
    });

    it('should handle null params and result', async () => {
      await service.log({ eventType: AuditLogEventType.SYSTEM_INFO });
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ params: null, result: null }),
      );
    });
  });

  describe('logRequestStart', () => {
    it('should log with correct event type and message', async () => {
      await service.logRequestStart({
        requestId: 'req-1', method: 'POST', path: '/api/users',
        userId: 'u1', ipAddress: '1.2.3.4',
      });
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          level: AuditLogLevel.INFO, eventType: AuditLogEventType.REQUEST_START,
          message: 'POST /api/users',
        }),
      );
    });
  });

  describe('logRequestEnd', () => {
    it('should log with status and duration', async () => {
      await service.logRequestEnd({
        requestId: 'req-1', method: 'GET', path: '/api/data',
        statusCode: 200, durationMs: 150,
      });
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'GET /api/data -> 200 (150ms)', statusCode: 200 }),
      );
    });
  });

  describe('logRequestError', () => {
    it('should extract error from Error object', async () => {
      await service.logRequestError({
        requestId: 'req-1', method: 'GET', path: '/api/missing',
        statusCode: 404, durationMs: 10, error: new Error('Not found'),
      });
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          level: AuditLogLevel.ERROR, errorMessage: 'Not found',
          errorStack: expect.stringContaining('Error: Not found'),
        }),
      );
    });

    it('should handle string error', async () => {
      await service.logRequestError({
        requestId: 'req-1', method: 'POST', path: '/api/fail',
        statusCode: 500, durationMs: 5, error: 'Something broke',
      });
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ errorMessage: 'Something broke' }),
      );
    });
  });

  describe('logMethodStart/End/Error', () => {
    it('should log method start with DEBUG level', async () => {
      await service.logMethodStart({ service: 'UserService', methodName: 'findById' });
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          level: AuditLogLevel.DEBUG, message: 'UserService.findById() started',
        }),
      );
    });

    it('should log method end with duration', async () => {
      await service.logMethodEnd({ service: 'UserService', methodName: 'findById', durationMs: 50 });
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'UserService.findById() completed (50ms)' }),
      );
    });

    it('should log method end without duration (line 141)', async () => {
      await service.logMethodEnd({ service: 'UserService', methodName: 'findAll' });
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'UserService.findAll() completed' }),
      );
    });

    it('should log method error', async () => {
      await service.logMethodError({
        service: 'UserService', methodName: 'create', error: new Error('Duplicate'),
      });
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          level: AuditLogLevel.ERROR, message: 'UserService.create() ERROR: Duplicate',
        }),
      );
    });
  });

  describe('logAuth', () => {
    it('should use WARN level for AUTH_FAILED', async () => {
      await service.logAuth({ eventType: AuditLogEventType.AUTH_FAILED, userEmail: 'u@t.com' });
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ level: AuditLogLevel.WARN }),
      );
    });

    it('should use INFO level for AUTH_LOGIN', async () => {
      await service.logAuth({ eventType: AuditLogEventType.AUTH_LOGIN, userId: 'u1' });
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ level: AuditLogLevel.INFO }),
      );
    });
  });

  describe('logExternalCall', () => {
    it('should log successful external call', async () => {
      await service.logExternalCall({
        service: 'Stripe', endpoint: '/charges', method: 'POST', success: true, statusCode: 200,
      });
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AuditLogEventType.EXTERNAL_RESPONSE,
          message: expect.stringContaining('External Stripe: POST /charges -> OK'),
        }),
      );
    });

    it('should log failed external call', async () => {
      await service.logExternalCall({
        service: 'Stripe', endpoint: '/charges', success: false, error: 'Timeout',
      });
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AuditLogEventType.EXTERNAL_ERROR, level: AuditLogLevel.ERROR,
        }),
      );
    });
  });

  describe('logScan', () => {
    it('should log scan start with INFO level (lines 194-195)', async () => {
      await service.logScan({
        eventType: AuditLogEventType.SCAN_START,
        requestId: 'req-1', userId: 'u1', projectId: 'p1', reportId: 'r1',
        message: 'Scan started',
      });
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          level: AuditLogLevel.INFO,
          eventType: AuditLogEventType.SCAN_START,
          message: 'Scan started',
          metadata: expect.objectContaining({ projectId: 'p1', reportId: 'r1' }),
        }),
      );
    });

    it('should log scan error with ERROR level', async () => {
      await service.logScan({
        eventType: AuditLogEventType.SCAN_ERROR,
        error: new Error('Scan failed'), userId: 'u1',
      });
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          level: AuditLogLevel.ERROR,
          errorMessage: 'Scan failed',
        }),
      );
    });
  });

  describe('info/warn/error', () => {
    it('should log info', async () => {
      await service.info('System started', { version: '1.0' });
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          level: AuditLogLevel.INFO, eventType: AuditLogEventType.SYSTEM_INFO,
        }),
      );
    });

    it('should log warn', async () => {
      await service.warn('Low memory');
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ level: AuditLogLevel.WARN, eventType: AuditLogEventType.SYSTEM_WARNING }),
      );
    });

    it('should log error with Error object', async () => {
      await service.error('Crash', new Error('OOM'));
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ level: AuditLogLevel.ERROR, errorMessage: 'OOM' }),
      );
    });
  });
});
