import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

/** S5: Extract refresh token from httpOnly cookie or body field */
function cookieOrBody(req: Request): string | null {
  const fromCookie = req?.cookies?.['refresh_token'];
  if (fromCookie) return fromCookie;
  // Fallback for Swagger / non-browser clients
  return (req?.body as Record<string, string> | undefined)?.['refreshToken'] ?? null;
}

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: cookieOrBody,
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET', 'dev-refresh-secret'),
      passReqToCallback: true,
    });
  }

  async validate(_req: Request, payload: JwtPayload) {
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
