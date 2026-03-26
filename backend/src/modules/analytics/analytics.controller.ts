import {
  Controller,
  Post,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { AnalyticsService, TrackEventDto } from './analytics.service';
import { TrackAnalyticsEventDto, TrackBatchDto } from './dto';

@Controller('analytics')
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('track')
  @HttpCode(HttpStatus.OK)
  async track(@Body() body: TrackAnalyticsEventDto, @Req() req: Request) {
    const ipAddress = this.getClientIp(req);
    const userAgent = req.headers['user-agent'];

    const dto: TrackEventDto = {
      sessionId: body.sessionId,
      visitorId: body.visitorId,
      eventName: body.eventName,
      eventData: body.eventData,
      page: body.page,
      referrer: body.referrer,
      hostname: body.hostname,
      scanId: body.scanId,
      funnelVariant: body.funnelVariant,
      utmSource: body.utm?.source,
      utmMedium: body.utm?.medium,
      utmCampaign: body.utm?.campaign,
      utmContent: body.utm?.content,
      utmTerm: body.utm?.term,
      language: body.language,
      screenWidth: body.screen?.width,
      screenHeight: body.screen?.height,
    };

    await this.analyticsService.track(dto, ipAddress, userAgent);

    return { success: true };
  }

  @Post('track/batch')
  @HttpCode(HttpStatus.OK)
  async trackBatch(@Body() body: TrackBatchDto, @Req() req: Request) {
    const ipAddress = this.getClientIp(req);
    const userAgent = req.headers['user-agent'];

    const dtos: TrackEventDto[] = body.events.map((event) => ({
      sessionId: event.sessionId,
      visitorId: event.visitorId,
      eventName: event.eventName,
      eventData: event.eventData,
      page: event.page,
      referrer: event.referrer,
      hostname: event.hostname,
      scanId: event.scanId,
      funnelVariant: event.funnelVariant,
      utmSource: event.utm?.source,
      utmMedium: event.utm?.medium,
      utmCampaign: event.utm?.campaign,
      utmContent: event.utm?.content,
      utmTerm: event.utm?.term,
      language: event.language,
      screenWidth: event.screen?.width,
      screenHeight: event.screen?.height,
    }));

    await this.analyticsService.trackBatch(dtos, ipAddress, userAgent);

    return { success: true, count: dtos.length };
  }

  private getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      const ips = Array.isArray(forwarded)
        ? forwarded[0]
        : forwarded.split(',')[0];
      return ips.trim();
    }
    return req.ip || req.socket.remoteAddress || 'unknown';
  }
}
