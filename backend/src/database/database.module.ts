import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminUser, AdminSession, ActivityLog, SecureStore, Company, CompanyMember, CompanyInvite } from './entities';
import { ProjectAuditLog } from './entities/project-audit-log.entity';
import { AnalyticsEvent } from './entities/analytics-event.entity';

@Module({
  imports: [
    // Main database connection
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('DATABASE_URL'),
        entities: [AdminUser, AdminSession, ActivityLog, SecureStore, Company, CompanyMember, CompanyInvite],
        extra: {
          family: 4,
          max: 20,
          min: 2,
        },
        migrations: ['dist/database/migrations/*.js'],
        migrationsRun: true,
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    // Audit database connection (centralized logs)
    TypeOrmModule.forRootAsync({
      name: 'audit',
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('AUDIT_DATABASE_URL'),
        extra: {
          family: 4,
          max: 20,
          min: 2,
        },
        entities: [ProjectAuditLog, AnalyticsEvent],
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
