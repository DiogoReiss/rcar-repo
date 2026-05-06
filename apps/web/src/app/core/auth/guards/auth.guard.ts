import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { ApiService } from '@core/services/api.service';

/**
 * S9: Verifies the session is active.
 * When an in-memory Bearer token is available (from login/refresh), allow navigation immediately
 * — the token will be re-validated on each API call.
 * When only a localStorage user profile exists (e.g. after page reload), validate the
 * httpOnly cookie via GET /auth/me to confirm the server session is still alive.
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const api = inject(ApiService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/auth/login']);
  }

  // If we have an in-memory token, it will be validated on each API call — no extra round-trip needed
  if (authService.getAccessToken()) {
    return true;
  }

  // After page reload: no in-memory token but user profile exists in localStorage.
  // Validate cookie freshness via /auth/me — the refresh interceptor will renew the token if expired.
  return api.get<{ id: string }>('/auth/me').pipe(
    map(() => true),
    catchError(() => {
      authService.logout();
      return of(router.createUrlTree(['/auth/login']));
    }),
  );
};

