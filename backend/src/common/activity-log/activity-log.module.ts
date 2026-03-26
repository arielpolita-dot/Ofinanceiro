/**
 * ==============================================================================
 * ActivityLogModule - Modulo Global de Log de Atividades
 * ==============================================================================
 *
 * Modulo global que disponibiliza o ActivityLogService em toda aplicacao
 * sem necessidade de importar em cada modulo.
 *
 * @module common/activity-log
 */
import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityLog } from '../../database/entities';
import { ActivityLogService } from './activity-log.service';
import { ActivityLogController } from './activity-log.controller';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([ActivityLog])],
  controllers: [ActivityLogController],
  providers: [ActivityLogService],
  exports: [ActivityLogService],
})
export class ActivityLogModule {}
