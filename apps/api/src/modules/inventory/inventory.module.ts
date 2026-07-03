import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller.js';
import { InventoryService } from './inventory.service.js';
import { InventoryRepository } from './inventory.repository.js';
import { PrismaInventoryRepository } from './prisma-inventory.repository.js';
import { StockDeductionService } from './stock-deduction.service.js';

@Module({
  controllers: [InventoryController],
  providers: [
    InventoryService,
    StockDeductionService,
    { provide: InventoryRepository, useClass: PrismaInventoryRepository },
  ],
  exports: [InventoryService],
})
export class InventoryModule {}
