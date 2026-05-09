import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

import { ApiService } from '@core/services/api.service';
import { AuthTokens, LoginCredentials, User } from '../models/user.model';

interface RegisterPayload {
  nome: string;
  email: string;
  senha: string;
}

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

  /** In-memory access token — avoids cookie cross-port issues in dev (localhost:4200 → :3000) */
  private _accessToken: string | null = null;

  constructor() {
    this.tryRestoreUser();
  }

  /** Returns the in-memory access token for Bearer auth. Set on login/refresh, cleared on logout. */
  getAccessToken(): string | null {
    return this._accessToken;
  }

  login(credentials: LoginCredentials): Observable<AuthTokens & { user: User }> {
    return this.api.post<AuthTokens & { user: User }>('/auth/login', credentials).pipe(
      tap((res) => {
        // Store access token in memory AND user profile in localStorage
        this._accessToken = res.accessToken;
        this._currentUser.set(res.user);
        localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(res.user));
      }),
    );
  }

  register(payload: RegisterPayload): Observable<{ message: string; user: Partial<User> }> {
    return this.api.post<{ message: string; user: Partial<User> }>('/auth/register', payload);
  }

  logout(): void {
    // Call server to clear httpOnly cookies + blacklist refresh token
    this.api.post('/auth/logout', {}).subscribe({ error: () => {} });
    this._accessToken = null;
    localStorage.removeItem(USER_PROFILE_KEY);
    this._currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  refreshToken(): Observable<AuthTokens> {
    return this.api.post<AuthTokens>('/auth/refresh', {}).pipe(
      tap((res) => {
        // Update in-memory token after successful refresh
        this._accessToken = res.accessToken;
      }),
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
