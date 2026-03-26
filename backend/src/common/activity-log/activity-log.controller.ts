/** ActivityLogController - Consulta e tracking de atividades */
import {
  Controller, Get, Post, Query, Body,
  UseGuards, Req, Headers, Ip, ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { ActivityLogService, ActivityQueryParams } from './activity-log.service';
import { AuthGuard } from '../guards/auth.guard';
import { OptionalAuthGuard } from '../guards/optional-auth.guard';
import { ActivityAction, ActivityResource } from '../../database/entities';
import { SkipThrottle } from '../decorators/throttle.decorator';
import { TrackEventDto, TrackPageViewDto } from './dto';
import { mapEventToAction, mapCategoryToResource } from './activity-event-mappers';

@Controller('activity')
export class ActivityLogController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  /** GET /activity - Lista atividades com filtros (scoped to current user) */
  @Get()
  @UseGuards(AuthGuard)
  @SkipThrottle()
  async getActivities(
    @Req() req: Request,
    @Query('userId') userId?: string,
    @Query('action') action?: ActivityAction | string,
    @Query('resourceType') resourceType?: ActivityResource,
    @Query('resourceId') resourceId?: string,
    @Query('success') success?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const currentUser = req?.['user'];
    // Regular users can only see their own activities
    const scopedUserId = currentUser?.role === 'admin'
      ? (userId || currentUser?.id)
      : currentUser?.id;

    if (userId && userId !== currentUser?.id && currentUser?.role !== 'admin') {
      throw new ForbiddenException('You can only view your own activities');
    }

    const params: ActivityQueryParams = {
      userId: scopedUserId,
      resourceType,
      resourceId,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
    };

    // Parse action (can be single or comma-separated)
    if (action) {
      if (action.includes(',')) {
        params.action = action.split(',') as ActivityAction[];
      } else {
        params.action = action as ActivityAction;
      }
    }

    // Parse success boolean
    if (success !== undefined) {
      params.success = success === 'true';
    }

    // Parse dates
    if (startDate) {
      params.startDate = new Date(startDate);
    }
    if (endDate) {
      params.endDate = new Date(endDate);
    }

    const result = await this.activityLogService.findAll(params);

    return {
      data: result.activities,
      meta: {
        total: result.total,
        limit: params.limit,
        offset: params.offset,
      },
    };
  }

  /** GET /activity/me - Atividades do usuario logado */
  @Get('me')
  @UseGuards(AuthGuard)
  @SkipThrottle()
  async getMyActivities(
    @Req() req: Request,
    @Query('limit') limit?: string,
  ) {
    const user = req?.['user'];
    if (!user?.id) {
      return { data: [], meta: { total: 0 } };
    }

    const activities = await this.activityLogService.findByUser(
      user.id,
      limit ? parseInt(limit) : 50,
    );

    return {
      data: activities,
      meta: { total: activities.length },
    };
  }

  /** GET /activity/recent (scoped to current user unless admin) */
  @Get('recent')
  @UseGuards(AuthGuard)
  @SkipThrottle()
  async getRecentActivities(
    @Req() req: Request,
    @Query('limit') limit?: string,
  ) {
    const currentUser = req?.['user'];
    const userId = currentUser?.role === 'admin' ? undefined : currentUser?.id;
    const activities = await this.activityLogService.getRecentActivities(
      limit ? parseInt(limit) : 100,
      userId,
    );

    return {
      data: activities,
      meta: { total: activities.length },
    };
  }

  /** GET /activity/today (scoped to current user unless admin) */
  @Get('today')
  @UseGuards(AuthGuard)
  @SkipThrottle()
  async getTodayActivities(@Req() req: Request) {
    const currentUser = req?.['user'];
    const userId = currentUser?.role === 'admin' ? undefined : currentUser?.id;
    const activities = await this.activityLogService.getTodayActivities(userId);

    return {
      data: activities,
      meta: { total: activities.length },
    };
  }

  /** GET /activity/stats (scoped to current user unless admin) */
  @Get('stats')
  @UseGuards(AuthGuard)
  @SkipThrottle()
  async getStats(
    @Req() req: Request,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const currentUser = req?.['user'];
    const scopedUserId = currentUser?.role === 'admin'
      ? userId
      : currentUser?.id;

    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    return this.activityLogService.getStats({
      userId: scopedUserId,
      startDate: start,
      endDate: end,
    });
  }

  /** GET /activity/count-by-action (admin only) */
  @Get('count-by-action')
  @UseGuards(AuthGuard)
  @SkipThrottle()
  async getCountByAction(
    @Req() req: Request,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const currentUser = req?.['user'];
    if (currentUser?.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    return this.activityLogService.countByAction(start, end);
  }

  /** GET /activity/count-by-user (admin only) */
  @Get('count-by-user')
  @UseGuards(AuthGuard)
  @SkipThrottle()
  async getCountByUser(
    @Req() req: Request,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const currentUser = req?.['user'];
    if (currentUser?.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    return this.activityLogService.countByUser(start, end);
  }

  /** GET /activity/failed-logins (admin only) */
  @Get('failed-logins')
  @UseGuards(AuthGuard)
  @SkipThrottle()
  async getFailedLogins(
    @Req() req: Request,
    @Query('email') email?: string,
    @Query('ipAddress') ipAddress?: string,
    @Query('since') since?: string,
  ) {
    const currentUser = req?.['user'];
    if (currentUser?.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
    const sinceDate = since ? new Date(since) : new Date(Date.now() - 24 * 60 * 60 * 1000);

    return this.activityLogService.getFailedLogins({
      email,
      ipAddress,
      since: sinceDate,
    });
  }

  /** POST /activity/track - Registra evento do frontend (auth opcional) */
  @Post('track')
  @UseGuards(OptionalAuthGuard)
  async trackEvent(
    @Body() dto: TrackEventDto,
    @Req() req: Request,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    const user = req?.['user'];

    // Mapear eventName para ActivityAction
    const action = mapEventToAction(dto.eventName);
    const resourceType = mapCategoryToResource(dto.category || dto.eventName);

    await this.activityLogService.log({
      userId: user?.id || null,
      userEmail: user?.email || null,
      action,
      resourceType,
      resourceId: dto.resourceId || null,
      resourceName: dto.resourceName || null,
      ipAddress: ip,
      userAgent,
      sessionId: null,
      metadata: {
        details: {
          eventName: dto.eventName,
          pageUrl: dto.pageUrl,
          pageName: dto.pageName,
          ...dto.params,
        },
      },
      success: dto.success ?? true,
      errorMessage: dto.errorMessage || null,
    });

    return { success: true };
  }

  /** POST /activity/track/pageview */
  @Post('track/pageview')
  @UseGuards(OptionalAuthGuard)
  async trackPageView(
    @Body() dto: TrackPageViewDto,
    @Req() req: Request,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    const user = req?.['user'];

    await this.activityLogService.log({
      userId: user?.id || null,
      userEmail: user?.email || null,
      action: ActivityAction.NAV_PAGE_VIEW,
      resourceType: ActivityResource.NAVIGATION,
      resourceId: null,
      resourceName: dto.pageName,
      ipAddress: ip,
      userAgent,
      sessionId: null,
      metadata: {
        details: {
          pageName: dto.pageName,
          pageUrl: dto.pageUrl || null,
        },
      },
      success: true,
    });

    return { success: true };
  }

}
