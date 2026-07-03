import { Module } from '@nestjs/common';
import { OperationalUnitsController } from './operational-units.controller.js';
import { OperationalUnitsService } from './operational-units.service.js';

@Module({
  controllers: [OperationalUnitsController],
  providers: [OperationalUnitsService],
  exports: [OperationalUnitsService],
})
export class OperationalUnitsModule {}
