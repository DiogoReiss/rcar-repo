import { Module } from '@nestjs/common';
import { RentalController } from './rental.controller.js';
import { RentalService } from './rental.service.js';
import { RentalPayableStrategy } from './rental-payable.strategy.js';
import { RentalRepository } from './rental.repository.js';
import { PrismaRentalRepository } from './prisma-rental.repository.js';
import { PaymentsModule } from '../payments/payments.module.js';

@Module({
  imports: [PaymentsModule],
  controllers: [RentalController],
  providers: [
    RentalService,
    RentalPayableStrategy,
    { provide: RentalRepository, useClass: PrismaRentalRepository },
  ],
  exports: [RentalService],
})
export class RentalModule {}
