import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminSessionsModule } from './admin-sessions.module';
import { CompanyModule } from '../company/company.module';

@Module({
  imports: [
    AdminSessionsModule,
    CompanyModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [],
})
export class AdminModule {}
