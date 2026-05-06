import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service.js';
import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private getRefreshOptions(): JwtSignOptions {
    return {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'dev-refresh-secret'),
      expiresIn: '7d',
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.ativo || user.deletedAt) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const passwordValid = await bcrypt.compare(dto.senha, user.senhaHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, this.getRefreshOptions()),
    };
  }

  async refresh(user: { id: string; email: string; role: string }) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, this.getRefreshOptions()),
    };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return { message: 'Se o e-mail existir, enviaremos instruções de recuperação.' };

    // TODO: Generate reset token and send email (Phase 6)
    return { message: 'Se o e-mail existir, enviaremos instruções de recuperação.' };
  }

  async resetPassword(token: string, novaSenha: string) {
    // TODO: Validate token and reset password (Phase 6)
    void token;
    void novaSenha;
    return { message: 'Senha redefinida com sucesso.' };
  }
}
