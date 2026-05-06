import { Module } from '@nestjs/common';
import { WashController } from './wash.controller.js';
import { WashService } from './wash.service.js';

@Module({
  controllers: [WashController],
  providers: [WashService],
  exports: [WashService],
})
export class WashModule {}

