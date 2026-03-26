import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { CustomThrottlerGuard } from './common/guards/custom-throttler.guard';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { LoggerModule } from './common/logger/logger.module';
import { CommonModule } from './common/common.module';
import { AuthBffModule } from './modules/auth/auth-bff.module';
import { AdminModule } from './modules/admin/admin.module';
import { CompanyModule } from './modules/company/company.module';
import { BillingModule } from './modules/billing/billing.module';
import { ActivityLogModule } from './common/activity-log';
import { AuditLoggerModule, AuditLoggerInterceptor } from './common/audit-logger';
import { AnalyticsModule } from './modules/analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: true,
      ignoreErrors: false,
    }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 3 },
      { name: 'medium', ttl: 10000, limit: 20 },
      { name: 'long', ttl: 60000, limit: 100 },
    ]),
    DatabaseModule,
    LoggerModule,
    AuditLoggerModule,
    AuthBffModule,
    CommonModule,
    ActivityLogModule,
    HealthModule,
    AdminModule,
    CompanyModule,
    BillingModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_GUARD, useClass: CustomThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditLoggerInterceptor },
  ],
})
export class AppModule {}
