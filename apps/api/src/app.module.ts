import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { InventoryModule } from './modules/inventory/inventory.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { CustomersModule } from './modules/customers/customers.module.js';
import { FleetModule } from './modules/fleet/fleet.module.js';
import { WashModule } from './modules/wash/wash.module.js';
import { LavajatoModule } from './modules/lavajato/lavajato.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    InventoryModule,
    UsersModule,
    CustomersModule,
    FleetModule,
    WashModule,
    LavajatoModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
