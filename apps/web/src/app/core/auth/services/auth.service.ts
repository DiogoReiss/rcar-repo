import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

import { ApiService } from '@core/services/api.service';
import { AuthTokens, LoginCredentials, User } from '../models/user.model';

const ACCESS_TOKEN_KEY = 'rcar_access_token';
const REFRESH_TOKEN_KEY = 'rcar_refresh_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  private readonly _currentUser = signal<User | null>(null);
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null || this.getAccessToken() !== null);

  constructor() {
    this.tryRestoreUser();
  }

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  login(credentials: LoginCredentials): Observable<AuthTokens> {
    return this.api.post<AuthTokens>('/auth/login', credentials).pipe(
      tap((tokens) => {
        this.storeTokens(tokens);
        this.decodeAndSetUser(tokens.accessToken);
      }),
    );
  }

  logout(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    this._currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  refreshToken(): Observable<AuthTokens> {
    const refreshToken = this.getRefreshToken();
    return this.api.post<AuthTokens>('/auth/refresh', { refreshToken }).pipe(
      tap((tokens) => {
        this.storeTokens(tokens);
        this.decodeAndSetUser(tokens.accessToken);
      }),
    );
  }

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.api.post<{ message: string }>('/auth/forgot-password', { email });
  }

  resetPassword(token: string, novaSenha: string): Observable<{ message: string }> {
    return this.api.post<{ message: string }>('/auth/reset-password', { token, novaSenha });
  }

  private storeTokens(tokens: AuthTokens): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  }

  private tryRestoreUser(): void {
    const token = this.getAccessToken();
    if (token) {
      this.decodeAndSetUser(token);
    }
  }

  private decodeAndSetUser(token: string): void {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      this._currentUser.set({
        id: payload.sub,
        nome: payload.nome ?? payload.email,
        email: payload.email,
        role: payload.role,
        ativo: true,
      });
    } catch {
      this._currentUser.set(null);
    }
  }
}
