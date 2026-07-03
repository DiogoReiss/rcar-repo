import { Module } from '@nestjs/common';
import { LavajatoController } from './lavajato.controller.js';
import { LavajatoService } from './lavajato.service.js';
import { QueueEventsService } from './queue-events.service.js';
import { WashSchedulePayableStrategy } from './wash-schedule-payable.strategy.js';
import { WashQueuePayableStrategy } from './wash-queue-payable.strategy.js';
import { PaymentsModule } from '../payments/payments.module.js';

@Module({
  imports: [PaymentsModule],
  controllers: [LavajatoController],
  providers: [
    LavajatoService,
    QueueEventsService,
    WashSchedulePayableStrategy,
    WashQueuePayableStrategy,
  ],
  exports: [LavajatoService, QueueEventsService],
})
export class LavajatoModule {}
