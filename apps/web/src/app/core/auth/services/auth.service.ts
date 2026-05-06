import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

import { ApiService } from '@core/services/api.service';
import { AuthTokens, LoginCredentials, User } from '../models/user.model';

/**
 * S5: Tokens are stored in httpOnly cookies set by the API (not accessible to JS).
 * The frontend only stores the decoded user profile in memory/signal.
 * The auth interceptor no longer needs to inject a Bearer header — cookies are sent automatically
 * with `withCredentials: true` on every request.
 *
 * Fallback: if the user profile is not available (e.g. page reload), we read the access_token
 * cookie is inaccessible, so we restore state from localStorage user-profile only (NOT the token).
 */

const USER_PROFILE_KEY = 'rcar_user_profile';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  private readonly _currentUser = signal<User | null>(null);
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);

  constructor() {
    this.tryRestoreUser();
  }

  /** @deprecated use isAuthenticated signal instead */
  getAccessToken(): string | null {
    // S5: token is in httpOnly cookie — not readable from JS.
    // Returning null forces the auth interceptor to rely on withCredentials cookies.
    return null;
  }

  getRefreshToken(): string | null {
    return null; // stored in httpOnly cookie
  }

  login(credentials: LoginCredentials): Observable<AuthTokens & { user: User }> {
    return this.api.post<AuthTokens & { user: User }>('/auth/login', credentials).pipe(
      tap((res) => {
        // Tokens are set in httpOnly cookies by the API — just store the user profile
        this._currentUser.set(res.user);
        localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(res.user));
      }),
    );
  }

  logout(): void {
    // Call server to clear httpOnly cookies + blacklist refresh token
    this.api.post('/auth/logout', {}).subscribe({ error: () => {} });
    localStorage.removeItem(USER_PROFILE_KEY);
    this._currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  refreshToken(): Observable<AuthTokens> {
    return this.api.post<AuthTokens>('/auth/refresh', {}).pipe(
      tap(() => { /* cookies refreshed server-side */ }),
    );
  }

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.api.post<{ message: string }>('/auth/forgot-password', { email });
  }

  resetPassword(token: string, novaSenha: string): Observable<{ message: string }> {
    return this.api.post<{ message: string }>('/auth/reset-password', { token, novaSenha });
  }

  private tryRestoreUser(): void {
    try {
      const raw = localStorage.getItem(USER_PROFILE_KEY);
      if (raw) this._currentUser.set(JSON.parse(raw) as User);
    } catch {
      this._currentUser.set(null);
    }
  }
}
