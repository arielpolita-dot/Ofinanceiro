import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthBffService } from './auth-bff.service';
import { AuthBffController } from './auth-bff.controller';
import { AuthBffGuard } from './auth-bff.guard';
import { SessionService } from './session.service';
import { UserSyncService, INVITE_ACCEPTOR } from './user-sync.service';
import { AdminUser } from '../../database/entities/admin-user.entity';
import { AdminSession } from '../../database/entities/admin-session.entity';
import { CompanyMember } from '../../database/entities/company-member.entity';
import { CompanyInvite } from '../../database/entities/company-invite.entity';
import { CompanyInviteService } from '../company/company-invite.service';
import { CompanyMemberService } from '../company/company-member.service';

@Global()
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([AdminUser, AdminSession, CompanyMember, CompanyInvite]),
  ],
  controllers: [AuthBffController],
  providers: [
    AuthBffService,
    AuthBffGuard,
    SessionService,
    UserSyncService,
    CompanyMemberService,
    CompanyInviteService,
    {
      provide: INVITE_ACCEPTOR,
      useExisting: CompanyInviteService,
    },
  ],
  exports: [AuthBffService, AuthBffGuard, UserSyncService],
})
export class AuthBffModule {}
