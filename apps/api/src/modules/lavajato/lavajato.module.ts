import { Module } from '@nestjs/common';
import { LavajatoController } from './lavajato.controller.js';
import { LavajatoService } from './lavajato.service.js';
import { QueueEventsService } from './queue-events.service.js';
import { WashSchedulePayableStrategy } from './wash-schedule-payable.strategy.js';
import { WashQueuePayableStrategy } from './wash-queue-payable.strategy.js';
import { LavajatoRepository } from './lavajato.repository.js';
import { PrismaLavajatoRepository } from './prisma-lavajato.repository.js';
import { PaymentsModule } from '../payments/payments.module.js';

@Module({
  imports: [PaymentsModule],
  controllers: [LavajatoController],
  providers: [
    LavajatoService,
    QueueEventsService,
    WashSchedulePayableStrategy,
    WashQueuePayableStrategy,
    { provide: LavajatoRepository, useClass: PrismaLavajatoRepository },
  ],
  exports: [LavajatoService, QueueEventsService],
})
export class LavajatoModule {}
