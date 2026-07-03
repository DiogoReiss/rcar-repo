import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailProcessor } from './email.processor.js';
import { ScheduledJobsService } from './scheduled-jobs.service.js';
import { MasterAgreementsModule } from '../master-agreements/master-agreements.module.js';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MasterAgreementsModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({ name: 'email' }),
  ],
  providers: [EmailProcessor, ScheduledJobsService],
  exports: [BullModule],
})
export class JobsModule {}
