import { Module } from '@nestjs/common';
import { MasterAgreementsController } from './master-agreements.controller.js';
import { MasterAgreementsService } from './master-agreements.service.js';

@Module({
  controllers: [MasterAgreementsController],
  providers: [MasterAgreementsService],
  exports: [MasterAgreementsService],
})
export class MasterAgreementsModule {}
