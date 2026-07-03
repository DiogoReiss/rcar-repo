import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller.js';
import { PaymentWebhookController } from './payment-webhook.controller.js';
import { PaymentsService } from './payments.service.js';
import { PAYMENT_GATEWAY } from './payment-gateway.js';
import { FakePaymentGateway } from './fake-payment.gateway.js';
import { PayableRegistry } from './payable-registry.js';
import { ContractClosedListener } from './contract-closed.listener.js';

@Module({
  controllers: [PaymentsController, PaymentWebhookController],
  providers: [
    PaymentsService,
    PayableRegistry,
    ContractClosedListener,
    { provide: PAYMENT_GATEWAY, useClass: FakePaymentGateway },
  ],
  exports: [PaymentsService, PAYMENT_GATEWAY, PayableRegistry],
})
export class PaymentsModule {}
