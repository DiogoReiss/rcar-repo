import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller.js';
import { PaymentsService } from './payments.service.js';
import { PAYMENT_GATEWAY } from './payment-gateway.js';
import { FakePaymentGateway } from './fake-payment.gateway.js';

@Module({
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    { provide: PAYMENT_GATEWAY, useClass: FakePaymentGateway },
  ],
  exports: [PaymentsService, PAYMENT_GATEWAY],
})
export class PaymentsModule {}
