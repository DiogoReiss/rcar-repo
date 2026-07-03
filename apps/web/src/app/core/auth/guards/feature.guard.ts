import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Feature } from '../models/user.model';

export function featureGuard(...requiredFeatures: Feature[]): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const user = authService.currentUser();

    if (!user) return router.createUrlTree(['/auth/login']);

    // GESTOR_GERAL always has full access
    if (user.role === 'GESTOR_GERAL') return true;

    // CLIENTE is not an internal user
    if (user.role === 'CLIENTE') return router.createUrlTree(['/']);

    const userFeatures = user.features ?? [];
    const hasAll = requiredFeatures.every((f) => userFeatures.includes(f));
    return hasAll ? true : router.createUrlTree(['/']);
  };
}
