import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { RefreshJwtStrategy } from './strategies/refresh-jwt.strategy.js';
import { TokenBlacklistService } from './token-blacklist.service.js';
import { MailModule } from '../mail/mail.module.js';
import { LoginAttemptsService } from './login-attempts.service.js';

@Module({
  imports: [
    PassportModule,
    MailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'dev-secret'),
        signOptions: { expiresIn: '15m' as const },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenBlacklistService,
    LoginAttemptsService,
    JwtStrategy,
    RefreshJwtStrategy,
    // S1: Apply throttler globally via APP_GUARD
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
  exports: [AuthService, TokenBlacklistService, LoginAttemptsService],
})
export class AuthModule {}
