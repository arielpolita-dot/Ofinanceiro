import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from '../../database/entities/company.entity';
import { CompanyMember } from '../../database/entities/company-member.entity';
import { CompanyInvite } from '../../database/entities/company-invite.entity';
import { AdminUser } from '../../database/entities/admin-user.entity';
import { CompanyService } from './company.service';
import { CompanyMemberService } from './company-member.service';
import { CompanyInviteService } from './company-invite.service';
import { CompanyController } from './company.controller';
import { InviteAcceptController } from './invite-accept.controller';
import { CompanyGuard } from '../../common/guards/company.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Company, CompanyMember, CompanyInvite, AdminUser]),
  ],
  controllers: [InviteAcceptController, CompanyController],
  providers: [
    CompanyService,
    CompanyMemberService,
    CompanyInviteService,
    CompanyGuard,
  ],
  exports: [CompanyService, CompanyMemberService, CompanyInviteService],
})
export class CompanyModule {}
