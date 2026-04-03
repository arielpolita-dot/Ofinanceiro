import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AnalyticsEvent, AnalyticsEventDocument } from '../../database/schemas';

export interface TrackEventDto {
  sessionId: string;
  visitorId?: string;
  eventName: string;
  eventData?: Record<string, unknown>;
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
    @InjectModel(AnalyticsEvent.name)
    private readonly analyticsModel: Model<AnalyticsEventDocument>,
  ) {}

  async track(
    dto: TrackEventDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AnalyticsEventDocument> {
    try {
      const event = await this.analyticsModel.create({
        sessionId: dto.sessionId,
        visitorId: dto.visitorId,
        eventName: dto.eventName,
        eventData: dto.eventData,
        page: dto.page,
        referrer: dto.referrer,
        hostname: dto.hostname,
        scanId: dto.scanId || (dto.eventData?.scan_id as string | undefined),
        funnelVariant: dto.funnelVariant || (dto.eventData?.funnel_variant as string | undefined),
        utmSource: dto.utmSource,
        utmMedium: dto.utmMedium,
        utmCampaign: dto.utmCampaign,
        utmContent: dto.utmContent,
        utmTerm: dto.utmTerm,
        userAgent,
        ipAddress,
        language: dto.language,
        screenWidth: dto.screenWidth,
        screenHeight: dto.screenHeight,
      });

      this.logger.debug(
        `[Analytics] ${dto.eventName} | session=${dto.sessionId} | scan=${dto.scanId || 'n/a'}`,
      );

      return event;
    } catch (error) {
      this.logger.error(`Failed to track event: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  async trackBatch(
    events: TrackEventDto[],
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AnalyticsEventDocument[]> {
    const docs = events.map((dto) => ({
      sessionId: dto.sessionId,
      visitorId: dto.visitorId,
      eventName: dto.eventName,
      eventData: dto.eventData,
      page: dto.page,
      referrer: dto.referrer,
      hostname: dto.hostname,
      scanId: dto.scanId || (dto.eventData?.scan_id as string | undefined),
      funnelVariant: dto.funnelVariant || (dto.eventData?.funnel_variant as string | undefined),
      utmSource: dto.utmSource,
      utmMedium: dto.utmMedium,
      utmCampaign: dto.utmCampaign,
      utmContent: dto.utmContent,
      utmTerm: dto.utmTerm,
      userAgent,
      ipAddress,
      language: dto.language,
      screenWidth: dto.screenWidth,
      screenHeight: dto.screenHeight,
    }));

    return this.analyticsModel.insertMany(docs) as Promise<AnalyticsEventDocument[]>;
  }

  async getEventsBySession(sessionId: string): Promise<AnalyticsEventDocument[]> {
    return this.analyticsModel
      .find({ sessionId })
      .sort({ created_at: 1 })
      .exec();
  }

  async getEventsByScan(scanId: string): Promise<AnalyticsEventDocument[]> {
    return this.analyticsModel
      .find({ scanId })
      .sort({ created_at: 1 })
      .exec();
  }

  async getFunnelStats(
    startDate: Date,
    endDate: Date,
  ): Promise<Record<string, number>> {
    const results = await this.analyticsModel.aggregate([
      {
        $match: {
          created_at: { $gte: startDate, $lte: endDate },
          eventName: { $regex: /^funnel_/ },
        },
      },
      { $group: { _id: '$eventName', count: { $sum: 1 } } },
    ]);

    return results.reduce(
      (acc, row) => {
        acc[row._id] = row.count;
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  async getConversionStats(
    startDate: Date,
    endDate: Date,
  ): Promise<Record<string, number>> {
    const results = await this.analyticsModel.aggregate([
      {
        $match: {
          created_at: { $gte: startDate, $lte: endDate },
          eventName: { $regex: /^conversion_/ },
        },
      },
      { $group: { _id: '$eventName', count: { $sum: 1 } } },
    ]);

    return results.reduce(
      (acc, row) => {
        acc[row._id] = row.count;
        return acc;
      },
      {} as Record<string, number>,
    );
  }
}
