import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { PrismaService } from '../../../prisma/prisma.service.js';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

/** S5/S6: Extract JWT from cookie, Authorization header, or ?token= query param (SSE) */
function cookieOrBearerOrQuery(req: Request): string | null {
  const fromCookie = req?.cookies?.['access_token'];
  if (fromCookie) return fromCookie;

  const fromQuery = req?.query?.['token'] as string | undefined;
  if (fromQuery) return fromQuery;

  const auth = req?.headers?.['authorization'];
  if (auth?.startsWith('Bearer ')) return auth.slice(7);

  return null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: cookieOrBearerOrQuery,
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'dev-secret'),
      passReqToCallback: true,
    });
  }

  async validate(_req: Request, payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, nome: true, email: true, role: true, ativo: true },
    });

    if (!user || !user.ativo) {
      throw new UnauthorizedException('Usuário inativo ou não encontrado');
    }

    return user;
  }
}
