import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FEATURES_KEY } from '../decorators/features.decorator.js';

@Injectable()
export class FeaturesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredFeatures = this.reflector.getAllAndOverride<string[]>(
      FEATURES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredFeatures?.length) return true;

    const request = context
      .switchToHttp()
      .getRequest<{ user?: { role?: string; features?: string[] } }>();
    const user = request.user;
    if (!user) return false;

    // GESTOR_GERAL bypasses all feature checks
    if (user.role === 'GESTOR_GERAL') return true;

    // CLIENTE is not an internal user — deny access to internal features
    if (user.role === 'CLIENTE') return false;

    const userFeatures = user.features ?? [];
    const hasAll = requiredFeatures.every((f) => userFeatures.includes(f));
    if (!hasAll)
      throw new ForbiddenException('Acesso não autorizado para este módulo');
    return true;
  }
}
