import { Module } from '@nestjs/common';
import { LavajatoController } from './lavajato.controller.js';
import { LavajatoService } from './lavajato.service.js';
import { QueueEventsService } from './queue-events.service.js';

@Module({
  controllers: [LavajatoController],
  providers: [LavajatoService, QueueEventsService],
  exports: [LavajatoService, QueueEventsService],
})
export class LavajatoModule {}

