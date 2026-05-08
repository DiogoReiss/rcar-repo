import { Module } from '@nestjs/common';
import { RentalController } from './rental.controller.js';
import { RentalService } from './rental.service.js';

@Module({
  controllers: [RentalController],
  providers: [RentalService],
  exports: [RentalService],
})
export class RentalModule {}
