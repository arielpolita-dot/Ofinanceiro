import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AnalyticsEvent,
  AnalyticsEventData,
} from '../../database/entities/analytics-event.entity';

export interface TrackEventDto {
  sessionId: string;
  visitorId?: string;
  eventName: string;
  eventData?: AnalyticsEventData;
  page?: string;
  referrer?: string;
  hostname?: string;
  scanId?: string;
  funnelVariant?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  language?: string;
  screenWidth?: number;
  screenHeight?: number;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(AnalyticsEvent, 'audit')
    private readonly analyticsRepository: Repository<AnalyticsEvent>,
  ) {}

  async track(
    dto: TrackEventDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AnalyticsEvent> {
    try {
      const event = this.analyticsRepository.create({
        sessionId: dto.sessionId,
        visitorId: dto.visitorId || null,
        eventName: dto.eventName,
        eventData: dto.eventData || null,
        page: dto.page || null,
        referrer: dto.referrer || null,
        hostname: dto.hostname || null,
        scanId: dto.scanId || (dto.eventData?.scan_id as string) || null,
        funnelVariant:
          dto.funnelVariant ||
          (dto.eventData?.funnel_variant as string) ||
          null,
        utmSource: dto.utmSource || null,
        utmMedium: dto.utmMedium || null,
        utmCampaign: dto.utmCampaign || null,
        utmContent: dto.utmContent || null,
        utmTerm: dto.utmTerm || null,
        userAgent: userAgent || null,
        ipAddress: ipAddress || null,
        language: dto.language || null,
        screenWidth: dto.screenWidth || null,
        screenHeight: dto.screenHeight || null,
      });

      const saved = await this.analyticsRepository.save(event);

      this.logger.debug(
        `[Analytics] ${dto.eventName} | session=${dto.sessionId} | scan=${dto.scanId || 'n/a'}`,
      );

      return saved as AnalyticsEvent;
    } catch (error) {
      this.logger.error(`Failed to track event: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  async trackBatch(
    events: TrackEventDto[],
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AnalyticsEvent[]> {
    const entities = events.map((dto) =>
      this.analyticsRepository.create({
        sessionId: dto.sessionId,
        visitorId: dto.visitorId || null,
        eventName: dto.eventName,
        eventData: dto.eventData || null,
        page: dto.page || null,
        referrer: dto.referrer || null,
        hostname: dto.hostname || null,
        scanId: dto.scanId || (dto.eventData?.scan_id as string) || null,
        funnelVariant:
          dto.funnelVariant ||
          (dto.eventData?.funnel_variant as string) ||
          null,
        utmSource: dto.utmSource || null,
        utmMedium: dto.utmMedium || null,
        utmCampaign: dto.utmCampaign || null,
        utmContent: dto.utmContent || null,
        utmTerm: dto.utmTerm || null,
        userAgent: userAgent || null,
        ipAddress: ipAddress || null,
        language: dto.language || null,
        screenWidth: dto.screenWidth || null,
        screenHeight: dto.screenHeight || null,
      }),
    );

    return this.analyticsRepository.save(entities) as Promise<AnalyticsEvent[]>;
  }

  async getEventsBySession(sessionId: string): Promise<AnalyticsEvent[]> {
    return this.analyticsRepository.find({
      where: { sessionId },
      order: { createdAt: 'ASC' },
    });
  }

  async getEventsByScan(scanId: string): Promise<AnalyticsEvent[]> {
    return this.analyticsRepository.find({
      where: { scanId },
      order: { createdAt: 'ASC' },
    });
  }

  async getFunnelStats(
    startDate: Date,
    endDate: Date,
  ): Promise<Record<string, number>> {
    const result = await this.analyticsRepository
      .createQueryBuilder('event')
      .select('event.event_name', 'eventName')
      .addSelect('COUNT(*)', 'count')
      .where('event.created_at >= :startDate', { startDate })
      .andWhere('event.created_at <= :endDate', { endDate })
      .andWhere("event.event_name LIKE 'funnel_%'")
      .groupBy('event.event_name')
      .getRawMany();

    return result.reduce(
      (acc, row) => {
        acc[row.eventName] = parseInt(row.count, 10);
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  async getConversionStats(
    startDate: Date,
    endDate: Date,
  ): Promise<Record<string, number>> {
    const result = await this.analyticsRepository
      .createQueryBuilder('event')
      .select('event.event_name', 'eventName')
      .addSelect('COUNT(*)', 'count')
      .where('event.created_at >= :startDate', { startDate })
      .andWhere('event.created_at <= :endDate', { endDate })
      .andWhere("event.event_name LIKE 'conversion_%'")
      .groupBy('event.event_name')
      .getRawMany();

    return result.reduce(
      (acc, row) => {
        acc[row.eventName] = parseInt(row.count, 10);
        return acc;
      },
      {} as Record<string, number>,
    );
  }
}
