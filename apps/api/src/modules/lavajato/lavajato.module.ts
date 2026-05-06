import { Module } from '@nestjs/common';
import { LavajatoController } from './lavajato.controller.js';
import { LavajatoService } from './lavajato.service.js';

@Module({
  controllers: [LavajatoController],
  providers: [LavajatoService],
  exports: [LavajatoService],
})
export class LavajatoModule {}

