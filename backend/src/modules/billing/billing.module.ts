import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { AdminUser } from '../../database/entities';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AdminUser])],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
