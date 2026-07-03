import { Module } from '@nestjs/common';
import { RentalController } from './rental.controller.js';
import { RentalService } from './rental.service.js';
import { PaymentsModule } from '../payments/payments.module.js';

@Module({
  imports: [PaymentsModule],
  controllers: [RentalController],
  providers: [RentalService],
  exports: [RentalService],
})
export class RentalModule {}
