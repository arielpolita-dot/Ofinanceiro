/** ActivityLogService - Registro e consulta de atividades para auditoria */
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { ActivityLog, ActivityAction, ActivityResource, ActivityMetadata } from '../../database/entities';

export interface LogActivityParams {
  userId?: string | null;
  userEmail?: string | null;
  action: ActivityAction;
  resourceType: ActivityResource;
  resourceId?: string | null;
  resourceName?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  sessionId?: string | null;
  metadata?: ActivityMetadata;
  success?: boolean;
  errorMessage?: string | null;
  durationMs?: number | null;
}

export interface ActivityQueryParams {
  userId?: string;
  action?: ActivityAction | ActivityAction[];
  resourceType?: ActivityResource;
  resourceId?: string;
  ipAddress?: string;
  success?: boolean;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface ActivityStats {
  totalActions: number;
  byAction: Record<string, number>;
  byResource: Record<string, number>;
  failedActions: number;
}

@Injectable()
export class ActivityLogService {
  private readonly logger = new Logger(ActivityLogService.name);

  constructor(
    @InjectRepository(ActivityLog)
    private readonly activityLogRepository: Repository<ActivityLog>,
  ) {}

  /** Registra uma atividade (nunca lanca excecao) */
  async log(params: LogActivityParams): Promise<ActivityLog | null> {
    try {
      const activity = this.activityLogRepository.create({
        userId: params.userId || null,
        userEmail: params.userEmail || null,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId || null,
        resourceName: params.resourceName || null,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent?.substring(0, 500) || null,
        sessionId: params.sessionId || null,
        metadata: params.metadata || null,
        success: params.success ?? true,
        errorMessage: params.errorMessage || null,
        durationMs: params.durationMs || null,
      });

      const saved = await this.activityLogRepository.save(activity);

      this.logger.debug(
        `Activity logged: ${params.action} on ${params.resourceType}` +
          (params.resourceId ? `/${params.resourceId}` : '') +
          ` by ${params.userEmail || params.userId || 'anonymous'}`,
      );

      return saved;
    } catch (error) {
      // Log nao deve quebrar a aplicacao
      this.logger.error(`Failed to log activity: ${(error as Error).message}`, (error as Error).stack);
      return null;
    }
  }

  /** Busca atividades com filtros */
  async findAll(params: ActivityQueryParams = {}): Promise<{
    activities: ActivityLog[];
    total: number;
  }> {
    const { userId, action, resourceType, resourceId, ipAddress, success, startDate, endDate, limit = 50, offset = 0 } = params;

    const where: Record<string, unknown> = {};

    if (userId) where.userId = userId;
    if (action) {
      where.action = Array.isArray(action) ? In(action) : action;
    }
    if (resourceType) where.resourceType = resourceType;
    if (resourceId) where.resourceId = resourceId;
    if (ipAddress) where.ipAddress = ipAddress;
    if (success !== undefined) where.success = success;
    if (startDate && endDate) {
      where.createdAt = Between(startDate, endDate);
    } else if (startDate) {
      where.createdAt = MoreThanOrEqual(startDate);
    } else if (endDate) {
      where.createdAt = LessThanOrEqual(endDate);
    }

    const [activities, total] = await this.activityLogRepository.findAndCount({
      where,
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return { activities, total };
  }

  /** Busca atividades de um usuario */
  async findByUser(userId: string, limit = 50): Promise<ActivityLog[]> {
    return this.activityLogRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /** Busca atividades de um recurso */
  async findByResource(resourceType: ActivityResource, resourceId: string, limit = 50): Promise<ActivityLog[]> {
    return this.activityLogRepository.find({
      where: { resourceType, resourceId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /** Busca ultimo login de um usuario */
  async getLastLogin(userId: string): Promise<ActivityLog | null> {
    return this.activityLogRepository.findOne({
      where: {
        userId,
        action: ActivityAction.LOGIN,
        success: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  /** Busca tentativas de login falhas */
  async getFailedLogins(params: { email?: string; ipAddress?: string; since?: Date }): Promise<ActivityLog[]> {
    const where: Record<string, unknown> = {
      action: ActivityAction.LOGIN_FAILED,
    };

    if (params.email) where.userEmail = params.email;
    if (params.ipAddress) where.ipAddress = params.ipAddress;
    if (params.since) where.createdAt = MoreThanOrEqual(params.since);

    return this.activityLogRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  /** Busca atividades recentes (dashboard). Filtra por userId se fornecido. */
  async getRecentActivities(limit = 100, userId?: string): Promise<ActivityLog[]> {
    const where: Record<string, unknown> = {};
    if (userId) where.userId = userId;

    return this.activityLogRepository.find({
      where,
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /** Busca atividades de hoje. Filtra por userId se fornecido. */
  async getTodayActivities(userId?: string): Promise<ActivityLog[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const where: Record<string, unknown> = {
      createdAt: MoreThanOrEqual(today),
    };
    if (userId) where.userId = userId;

    return this.activityLogRepository.find({
      where,
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  /** Estatisticas de atividade */
  async getStats(params: { userId?: string; startDate: Date; endDate: Date }): Promise<ActivityStats> {
    const where: Record<string, unknown> = {
      createdAt: Between(params.startDate, params.endDate),
    };
    if (params.userId) where.userId = params.userId;

    const activities = await this.activityLogRepository.find({ where });

    const byAction: Record<string, number> = {};
    const byResource: Record<string, number> = {};
    let failedActions = 0;

    for (const activity of activities) {
      byAction[activity.action] = (byAction[activity.action] || 0) + 1;
      byResource[activity.resourceType] = (byResource[activity.resourceType] || 0) + 1;
      if (!activity.success) failedActions++;
    }

    return {
      totalActions: activities.length,
      byAction,
      byResource,
      failedActions,
    };
  }

  /** Conta atividades por acao em um periodo */
  async countByAction(startDate: Date, endDate: Date): Promise<Record<string, number>> {
    const result = await this.activityLogRepository
      .createQueryBuilder('al')
      .select('al.action', 'action')
      .addSelect('COUNT(*)', 'count')
      .where('al.created_at BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('al.action')
      .getRawMany();

    const counts: Record<string, number> = {};
    for (const row of result) {
      counts[row.action] = parseInt(row.count);
    }
    return counts;
  }

  /** Conta atividades por usuario em um periodo */
  async countByUser(startDate: Date, endDate: Date): Promise<{ userId: string; userEmail: string; count: number }[]> {
    const result = await this.activityLogRepository
      .createQueryBuilder('al')
      .select('al.user_id', 'userId')
      .addSelect('al.user_email', 'userEmail')
      .addSelect('COUNT(*)', 'count')
      .where('al.created_at BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('al.user_id IS NOT NULL')
      .groupBy('al.user_id')
      .addGroupBy('al.user_email')
      .orderBy('count', 'DESC')
      .limit(50)
      .getRawMany();

    return result.map((row) => ({
      userId: row.userId,
      userEmail: row.userEmail,
      count: parseInt(row.count),
    }));
  }

  /** Limpa logs antigos (retencao) */
  async cleanOldLogs(retentionDays: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await this.activityLogRepository.createQueryBuilder().delete().where('created_at < :cutoffDate', { cutoffDate }).execute();

    this.logger.log(`Cleaned ${result.affected} old activity logs`);
    return result.affected || 0;
  }
}
