/**
 * ==============================================================================
 * AuditLoggerModule - Modulo Global de Audit Logging
 * ==============================================================================
 *
 * Modulo global que disponibiliza o AuditLoggerService em toda aplicacao
 * sem necessidade de importar em cada modulo.
 *
 * Usa conexao separada 'audit' para o banco centralizado do dashboard.
 *
 * @module common/audit-logger
 */
import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectAuditLog } from '../../database/entities/project-audit-log.entity';
import { AuditLoggerService } from './audit-logger.service';

@Global()
@Module({
  imports: [
    // Conexao audit - banco centralizado do dashboard
    TypeOrmModule.forFeature([ProjectAuditLog], 'audit'),
  ],
  providers: [AuditLoggerService],
  exports: [AuditLoggerService],
})
export class AuditLoggerModule {}
