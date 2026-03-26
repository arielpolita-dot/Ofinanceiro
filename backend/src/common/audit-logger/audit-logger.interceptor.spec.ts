import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { AuditLoggerInterceptor } from './audit-logger.interceptor';
import { AuditLoggerService } from './audit-logger.service';

describe('AuditLoggerInterceptor', () => {
  let interceptor: AuditLoggerInterceptor;
  let mockAuditLogger: Record<string, jest.Mock>;

  const mkCtx = (o: Record<string, any> = {}): ExecutionContext => {
    const request: Record<string, unknown> = {
      method: o.method || 'GET', path: o.path || '/api/test',
      originalUrl: o.originalUrl ?? '/api/test', user: o.user,
      query: o.query || {}, body: o.body || {}, params: o.params || {},
      ip: 'ip' in o ? o.ip : '127.0.0.1', socket: o.socket,
      headers: { 'user-agent': o.userAgent ?? 'Jest/1.0', 'x-forwarded-for': undefined, ...o.headers },
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request, getResponse: () => ({ statusCode: 200 }),
      }),
    } as unknown as ExecutionContext;
  };
  const mkHandler = (result: unknown = { data: 'ok' }): CallHandler => ({ handle: () => of(result) });
  const mkErrHandler = (err: Error): CallHandler => ({ handle: () => throwError(() => err) });

  beforeEach(() => {
    mockAuditLogger = {
      generateRequestId: jest.fn().mockReturnValue('req-uuid-1'),
      logRequestStart: jest.fn().mockResolvedValue(undefined),
      logRequestEnd: jest.fn().mockResolvedValue(undefined),
      logRequestError: jest.fn().mockResolvedValue(undefined),
    };
    interceptor = new AuditLoggerInterceptor(mockAuditLogger as unknown as AuditLoggerService);
  });

  describe('intercept - success flow', () => {
    it('should log request start and end', (done) => {
      const ctx = mkCtx({ user: { id: 'u1', email: 'u@t.com' } });
      interceptor.intercept(ctx, mkHandler({ data: [1, 2, 3] })).subscribe({
        next: () => {
          expect(mockAuditLogger.logRequestStart).toHaveBeenCalledWith(
            expect.objectContaining({ requestId: 'req-uuid-1', method: 'GET', path: '/api/test', userId: 'u1', userEmail: 'u@t.com' }),
          );
          expect(mockAuditLogger.logRequestEnd).toHaveBeenCalledWith(
            expect.objectContaining({ requestId: 'req-uuid-1', statusCode: 200, durationMs: expect.any(Number), result: expect.objectContaining({ hasData: true, count: 3 }) }),
          );
        },
        complete: done,
      });
    });

    it('should assign requestId to request object', () => {
      const ctx = mkCtx();
      interceptor.intercept(ctx, mkHandler()).subscribe();
      expect(ctx.switchToHttp().getRequest()['requestId']).toBe('req-uuid-1');
    });

    it('should handle null user gracefully', (done) => {
      interceptor.intercept(mkCtx(), mkHandler()).subscribe({
        next: () => { expect(mockAuditLogger.logRequestStart).toHaveBeenCalledWith(expect.objectContaining({ userId: null, userEmail: null })); },
        complete: done,
      });
    });

    it('should extract query, body, and route params', (done) => {
      const ctx = mkCtx({ query: { page: '1' }, body: { name: 'test' }, params: { id: '123' } });
      interceptor.intercept(ctx, mkHandler()).subscribe({
        next: () => {
          expect(mockAuditLogger.logRequestStart).toHaveBeenCalledWith(
            expect.objectContaining({ params: { query: { page: '1' }, body: { name: 'test' }, params: { id: '123' } } }),
          );
        },
        complete: done,
      });
    });

    it('should pass null params when request has no params', (done) => {
      interceptor.intercept(mkCtx(), mkHandler()).subscribe({
        next: () => { expect(mockAuditLogger.logRequestStart).toHaveBeenCalledWith(expect.objectContaining({ params: null })); },
        complete: done,
      });
    });

    it('should handle array user-agent header (line 61)', (done) => {
      const ctx = mkCtx({ userAgent: ['Agent/1.0', 'Agent/2.0'] });
      interceptor.intercept(ctx, mkHandler()).subscribe({
        next: () => { expect(mockAuditLogger.logRequestStart).toHaveBeenCalledWith(expect.objectContaining({ userAgent: 'Agent/1.0' })); },
        complete: done,
      });
    });

    it('should use path when originalUrl is falsy (line 66/83)', (done) => {
      const ctx = mkCtx({ originalUrl: '', path: '/fallback' });
      interceptor.intercept(ctx, mkHandler()).subscribe({
        next: () => {
          expect(mockAuditLogger.logRequestStart).toHaveBeenCalledWith(expect.objectContaining({ path: '/fallback' }));
          expect(mockAuditLogger.logRequestEnd).toHaveBeenCalledWith(expect.objectContaining({ path: '/fallback' }));
        },
        complete: done,
      });
    });
  });

  describe('intercept - error flow', () => {
    it('should log error and re-throw', (done) => {
      const error = Object.assign(new Error('Not found'), { status: 404, code: 'NOT_FOUND' });
      interceptor.intercept(mkCtx(), mkErrHandler(error)).subscribe({
        error: (err) => {
          expect(err.message).toBe('Not found');
          expect(mockAuditLogger.logRequestError).toHaveBeenCalledWith(
            expect.objectContaining({ requestId: 'req-uuid-1', statusCode: 404, errorCode: 'NOT_FOUND' }),
          );
          done();
        },
      });
    });

    it('should default to 500 when error has no status', (done) => {
      interceptor.intercept(mkCtx(), mkErrHandler(new Error('Unknown'))).subscribe({
        error: () => { expect(mockAuditLogger.logRequestError).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 500 })); done(); },
      });
    });

    it('should use path fallback in catchError (line 98)', (done) => {
      const ctx = mkCtx({ originalUrl: '', path: '/err-path' });
      interceptor.intercept(ctx, mkErrHandler(new Error('fail'))).subscribe({
        error: () => { expect(mockAuditLogger.logRequestError).toHaveBeenCalledWith(expect.objectContaining({ path: '/err-path' })); done(); },
      });
    });
  });

  describe('result summarization', () => {
    it('should summarize paginated data response', (done) => {
      interceptor.intercept(mkCtx(), mkHandler({ data: [1, 2], meta: { total: 100 } })).subscribe({
        next: () => { expect(mockAuditLogger.logRequestEnd).toHaveBeenCalledWith(expect.objectContaining({ result: { hasData: true, count: 2, meta: { total: 100 } } })); },
        complete: done,
      });
    });

    it('should summarize array response', (done) => {
      interceptor.intercept(mkCtx(), mkHandler([1, 2, 3, 4, 5])).subscribe({
        next: () => { expect(mockAuditLogger.logRequestEnd).toHaveBeenCalledWith(expect.objectContaining({ result: { count: 5 } })); },
        complete: done,
      });
    });

    it('should summarize object with nested object and array values', (done) => {
      interceptor.intercept(mkCtx(), mkHandler({ id: '1', name: 'test', nested: { a: 1 }, items: [1, 2] })).subscribe({
        next: () => {
          expect(mockAuditLogger.logRequestEnd).toHaveBeenCalledWith(
            expect.objectContaining({ result: expect.objectContaining({ id: '1', name: 'test', nested: '[Object]', items: '[Array(2)]' }) }),
          );
        },
        complete: done,
      });
    });

    it('should handle null response body', (done) => {
      interceptor.intercept(mkCtx(), mkHandler(null)).subscribe({
        next: () => { expect(mockAuditLogger.logRequestEnd).toHaveBeenCalledWith(expect.objectContaining({ result: null })); },
        complete: done,
      });
    });

    it('should handle primitive response', (done) => {
      interceptor.intercept(mkCtx(), mkHandler('plain-string')).subscribe({
        next: () => { expect(mockAuditLogger.logRequestEnd).toHaveBeenCalledWith(expect.objectContaining({ result: { value: 'plain-string' } })); },
        complete: done,
      });
    });

    it('should count 1 for non-array data property (line 149)', (done) => {
      interceptor.intercept(mkCtx(), mkHandler({ data: 'single' })).subscribe({
        next: () => { expect(mockAuditLogger.logRequestEnd).toHaveBeenCalledWith(expect.objectContaining({ result: { hasData: true, count: 1 } })); },
        complete: done,
      });
    });
  });

  describe('client IP extraction', () => {
    it('should use x-forwarded-for string header', (done) => {
      const ctx = mkCtx({ headers: { 'x-forwarded-for': '203.0.113.50, 70.41.3.18' } });
      interceptor.intercept(ctx, mkHandler()).subscribe({
        next: () => { expect(mockAuditLogger.logRequestStart).toHaveBeenCalledWith(expect.objectContaining({ ipAddress: '203.0.113.50' })); },
        complete: done,
      });
    });

    it('should handle x-forwarded-for as array (line 188-189)', (done) => {
      const ctx = mkCtx({ headers: { 'x-forwarded-for': ['10.0.0.1', '10.0.0.2'] } });
      interceptor.intercept(ctx, mkHandler()).subscribe({
        next: () => { expect(mockAuditLogger.logRequestStart).toHaveBeenCalledWith(expect.objectContaining({ ipAddress: '10.0.0.1' })); },
        complete: done,
      });
    });

    it('should fall back to request.ip', (done) => {
      interceptor.intercept(mkCtx({ ip: '10.0.0.1' }), mkHandler()).subscribe({
        next: () => { expect(mockAuditLogger.logRequestStart).toHaveBeenCalledWith(expect.objectContaining({ ipAddress: '10.0.0.1' })); },
        complete: done,
      });
    });

    it('should fall back to socket.remoteAddress (line 193)', (done) => {
      const ctx = mkCtx({ ip: undefined, socket: { remoteAddress: '192.168.1.1' } });
      interceptor.intercept(ctx, mkHandler()).subscribe({
        next: () => { expect(mockAuditLogger.logRequestStart).toHaveBeenCalledWith(expect.objectContaining({ ipAddress: '192.168.1.1' })); },
        complete: done,
      });
    });

    it('should return null when no IP source available (line 193)', (done) => {
      const ctx = mkCtx({ ip: undefined });
      interceptor.intercept(ctx, mkHandler()).subscribe({
        next: () => { expect(mockAuditLogger.logRequestStart).toHaveBeenCalledWith(expect.objectContaining({ ipAddress: null })); },
        complete: done,
      });
    });
  });
});
