import { Module } from '@nestjs/common';
import { MasterAgreementsController } from './master-agreements.controller.js';
import { MasterAgreementsService } from './master-agreements.service.js';
import { BillingController } from './billing.controller.js';
import { BillingService } from './billing.service.js';
import { PaymentsModule } from '../payments/payments.module.js';

@Module({
  imports: [PaymentsModule],
  controllers: [MasterAgreementsController, BillingController],
  providers: [MasterAgreementsService, BillingService],
  exports: [MasterAgreementsService, BillingService],
})
export class MasterAgreementsModule {}
