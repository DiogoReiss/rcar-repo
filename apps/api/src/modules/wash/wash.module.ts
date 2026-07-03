import { Module } from '@nestjs/common';
import { WashController } from './wash.controller.js';
import { WashService } from './wash.service.js';
import { WashRepository } from './wash.repository.js';
import { PrismaWashRepository } from './prisma-wash.repository.js';

@Module({
  controllers: [WashController],
  providers: [
    WashService,
    { provide: WashRepository, useClass: PrismaWashRepository },
  ],
  exports: [WashService],
})
export class WashModule {}
