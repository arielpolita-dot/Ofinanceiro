import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  NotFoundException,
  ForbiddenException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CompanyGuard } from '../../common/guards/company.guard';
import { CompanyRoles } from '../../common/decorators/company-roles.decorator';
import { CompanyRole } from '../../database/entities/company-role.enum';
import { AdminUser } from '../../database/entities/admin-user.entity';
import { CompanyService } from './company.service';
import { CompanyMemberService } from './company-member.service';
import { CompanyInviteService } from './company-invite.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { AuthUser as AuthUserType } from '../auth/auth-bff.types';

@Controller('companies')
@UseGuards(AuthGuard)
export class CompanyController {
  constructor(
    private readonly companyService: CompanyService,
    private readonly memberService: CompanyMemberService,
    private readonly inviteService: CompanyInviteService,
    @InjectRepository(AdminUser)
    private readonly userRepository: Repository<AdminUser>,
  ) {}

  @Get()
  async findAll(@Req() req: Request) {
    const user = req.user as AuthUserType;
    return this.companyService.findAllByUser(user.id);
  }

  @Post()
  async create(@Req() req: Request, @Body() dto: CreateCompanyDto) {
    const user = req.user as AuthUserType;
    return this.companyService.create(user.id, dto);
  }

  @Get(':id')
  @UseGuards(CompanyGuard)
  async findOne(@Param('id') id: string) {
    return this.companyService.findById(id);
  }

  @Patch(':id')
  @UseGuards(CompanyGuard)
  @CompanyRoles(CompanyRole.OWNER, CompanyRole.ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateCompanyDto) {
    return this.companyService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(CompanyGuard)
  @CompanyRoles(CompanyRole.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.companyService.delete(id);
  }

  @Get(':id/members')
  @UseGuards(CompanyGuard)
  async getMembers(@Param('id') id: string) {
    return this.memberService.getMembers(id);
  }

  @Post(':id/members')
  @UseGuards(CompanyGuard)
  @CompanyRoles(CompanyRole.OWNER, CompanyRole.ADMIN)
  async inviteMember(
    @Param('id') companyId: string,
    @Body() dto: InviteMemberDto,
    @Req() req: Request,
  ) {
    const user = req.user as AuthUserType;
    const email = dto.email.toLowerCase();

    const invitedUser = await this.userRepository.findOne({
      where: { email },
    });

    if (invitedUser) {
      const member = await this.memberService.addMember(
        companyId, invitedUser.id, dto.role, user.id,
      );
      return { status: 'added', member };
    }

    const company = await this.companyService.findById(companyId);
    const invite = await this.inviteService.createInvite(
      companyId, email, dto.role, user.id,
      company.name, user.name || user.email,
    );
    return { status: 'invited', invite };
  }

  @Get(':id/invites')
  @UseGuards(CompanyGuard)
  @CompanyRoles(CompanyRole.OWNER, CompanyRole.ADMIN)
  async getInvites(@Param('id') companyId: string) {
    return this.inviteService.getPendingInvites(companyId);
  }

  @Delete(':id/invites/:inviteId')
  @UseGuards(CompanyGuard)
  @CompanyRoles(CompanyRole.OWNER, CompanyRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancelInvite(
    @Param('id') companyId: string,
    @Param('inviteId') inviteId: string,
  ) {
    await this.inviteService.cancelInvite(inviteId, companyId);
  }

  @Patch(':id/members/:userId')
  @UseGuards(CompanyGuard)
  @CompanyRoles(CompanyRole.OWNER)
  async updateMemberRole(
    @Param('id') companyId: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    const updated = await this.memberService.updateRole(
      companyId, userId, dto.role,
    );
    if (!updated) {
      throw new NotFoundException('Member not found');
    }
    return updated;
  }

  @Delete(':id/members/:userId')
  @UseGuards(CompanyGuard)
  @CompanyRoles(CompanyRole.OWNER, CompanyRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMember(
    @Param('id') companyId: string,
    @Param('userId') userId: string,
  ) {
    await this.memberService.removeMember(companyId, userId);
  }

  @Post(':id/switch')
  async switchCompany(
    @Param('id') companyId: string,
    @Req() req: Request,
  ) {
    const user = req.user as AuthUserType;
    const role = await this.memberService.getMemberRole(companyId, user.id);
    if (!role) {
      throw new ForbiddenException('Not a member of this company');
    }

    const company = await this.companyService.findById(companyId);
    return { activeCompanyId: companyId, company };
  }
}
