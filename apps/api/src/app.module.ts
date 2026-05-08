import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from '@modules/auth/auth.module.js';
import { InventoryModule } from '@modules/inventory/inventory.module';
import { UsersModule } from '@modules/users/users.module.js';
import { CustomersModule } from '@modules/customers/customers.module.js';
import { FleetModule } from '@modules/fleet/fleet.module.js';
import { WashModule } from '@modules/wash/wash.module.js';
import { LavajatoModule } from '@modules/lavajato/lavajato.module.js';
import { RentalModule } from '@modules/rental/rental.module.js';
import { ReportsModule } from '@modules/reports/reports.module.js';
import { TemplatesModule } from '@modules/templates/templates.module.js';
import { DocumentsModule } from '@modules/documents/documents.module.js';
import { PaymentsModule } from '@modules/payments/payments.module.js';
import { MailModule } from '@modules/mail/mail.module.js';
import { JobsModule } from '@modules/jobs/jobs.module.js';
import { HealthModule } from '@modules/health/health.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // S1: Global rate limiting — 60 req/min per IP; login uses stricter override
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    PrismaModule,
    MailModule,
    JobsModule,
    AuthModule,
    InventoryModule,
    UsersModule,
    CustomersModule,
    FleetModule,
    WashModule,
    LavajatoModule,
    RentalModule,
    ReportsModule,
    PaymentsModule,
    TemplatesModule,
    DocumentsModule,
    HealthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
