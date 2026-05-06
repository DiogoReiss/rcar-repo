import { Injectable, UnauthorizedException, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service.js';
import { TokenBlacklistService } from './token-blacklist.service.js';
import { MailService } from '../mail/mail.service.js';
import { LoginDto } from './dto/login.dto.js';
import { LoginAttemptsService } from './login-attempts.service.js';

const COOKIE_BASE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly blacklist: TokenBlacklistService,
    private readonly mailService: MailService,
    private readonly loginAttempts: LoginAttemptsService,
  ) {}

  private get refreshSecret() {
    return this.configService.get<string>('JWT_REFRESH_SECRET', 'dev-refresh-secret');
  }

  private getRefreshOptions(): JwtSignOptions {
    return { secret: this.refreshSecret, expiresIn: '7d' };
  }

  private setTokenCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie('access_token', accessToken, { ...COOKIE_BASE, maxAge: 15 * 60 * 1000 });
    res.cookie('refresh_token', refreshToken, { ...COOKIE_BASE, maxAge: 7 * 24 * 60 * 60 * 1000 });
  }

  private clearTokenCookies(res: Response) {
    res.clearCookie('access_token', COOKIE_BASE);
    res.clearCookie('refresh_token', COOKIE_BASE);
  }

  async login(dto: LoginDto, res: Response) {
    // S11: Per-account lockout check
    if (this.loginAttempts.isLocked(dto.email)) {
      const ms = this.loginAttempts.getRemainingLockMs(dto.email);
      throw new HttpException(
        `Conta temporariamente bloqueada. Tente novamente em ${Math.ceil(ms / 60000)} minuto(s).`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    if (!user || !user.ativo || user.deletedAt) {
      this.loginAttempts.recordFailure(dto.email);
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const passwordValid = await bcrypt.compare(dto.senha, user.senhaHash);
    if (!passwordValid) {
      this.loginAttempts.recordFailure(dto.email);
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Success — clear failure counter
    this.loginAttempts.clearAttempts(dto.email);

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, this.getRefreshOptions());

    // S5: Set httpOnly cookies
    this.setTokenCookies(res, accessToken, refreshToken);

    return {
      user: { id: user.id, nome: user.nome, email: user.email, role: user.role },
      // Also return tokens in body for Swagger/non-browser clients
      accessToken,
      refreshToken,
    };
  }

  async refresh(user: { id: string; email: string; role: string }, res: Response) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, this.getRefreshOptions());

    this.setTokenCookies(res, accessToken, refreshToken);

    return { accessToken, refreshToken };
  }

  logout(refreshToken: string | undefined, res: Response) {
    // S4: Blacklist the refresh token
    if (refreshToken) {
      this.blacklist.revoke(refreshToken);
    }
    this.clearTokenCookies(res);
    return { message: 'Sessão encerrada.' };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    // Always same response to avoid email enumeration
    if (!user || !user.ativo || user.deletedAt) {
      return { message: 'Se o e-mail existir, enviaremos instruções de recuperação.' };
    }

    // S2: Generate secure random token, valid 1 hour
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt },
    });

    const resetUrl = `${this.configService.get('APP_URL', 'http://localhost:4200')}/auth/reset-password?token=${token}`;

    try {
      await this.mailService.sendPasswordReset(user.email, resetUrl);
    } catch {
      // Log but don't leak info
    }

    return { message: 'Se o e-mail existir, enviaremos instruções de recuperação.' };
  }

  async resetPassword(token: string, novaSenha: string) {
    const resetToken = await this.prisma.passwordResetToken.findUnique({ where: { token } });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Token inválido ou expirado.');
    }

    const hash = await bcrypt.hash(novaSenha, 12);

    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: resetToken.userId }, data: { senhaHash: hash } }),
      this.prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
    ]);

    return { message: 'Senha redefinida com sucesso.' };
  }
}
