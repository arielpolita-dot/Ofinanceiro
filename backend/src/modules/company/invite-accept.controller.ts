import {
  Controller,
  Get,
  Post,
  Param,
  Req,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthGuard } from '../../common/guards/auth.guard';
import { AdminUser } from '../../database/entities/admin-user.entity';
import { CompanyInviteService } from './company-invite.service';
import { AuthUser as AuthUserType } from '../auth/auth-bff.types';

@Controller('companies/invites')
export class InviteAcceptController {
  constructor(
    private readonly inviteService: CompanyInviteService,
    @InjectRepository(AdminUser)
    private readonly userRepository: Repository<AdminUser>,
  ) {}

  /** Public endpoint: get invite info by token (no auth) */
  @Get(':token/info')
  async getInviteInfo(@Param('token') token: string) {
    return this.inviteService.getInviteInfo(token);
  }

  /** Accept an invite (requires authentication) */
  @Post(':token/accept')
  @UseGuards(AuthGuard)
  async acceptInvite(
    @Param('token') token: string,
    @Req() req: Request,
  ) {
    const user = req.user as AuthUserType;
    const invite = await this.inviteService.acceptInvite(token, user.id);

    return {
      status: 'accepted',
      companyId: invite.companyId,
      role: invite.role,
    };
  }
}
