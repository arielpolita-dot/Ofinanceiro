import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request, Response } from 'express';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const route = req.route?.path || req.path;
    const method = req.method;

    this.metricsService.httpRequestsInFlight.inc();
    const stopTimer = this.metricsService.httpRequestDuration.startTimer({
      method,
      route,
    });

    return next.handle().pipe(
      tap({
        next: () => {
          const res = context.switchToHttp().getResponse<Response>();
          const statusCode = String(res.statusCode);
          stopTimer({ status_code: statusCode });
          this.metricsService.httpRequestsTotal.inc({
            method,
            route,
            status_code: statusCode,
          });
          this.metricsService.httpRequestsInFlight.dec();

          const contentLength = res.getHeader('content-length');
          if (contentLength) {
            this.metricsService.httpResponseSize.observe(
              { method, route },
              Number(contentLength),
            );
          }
        },
        error: () => {
          const res = context.switchToHttp().getResponse<Response>();
          const statusCode = String(res.statusCode || 500);
          stopTimer({ status_code: statusCode });
          this.metricsService.httpRequestsTotal.inc({
            method,
            route,
            status_code: statusCode,
          });
          this.metricsService.httpRequestsInFlight.dec();
        },
      }),
    );
  }
}
