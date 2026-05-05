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
  readonly isAuthenticated = computed(() => this._currentUser() !== null);

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  login(credentials: LoginCredentials): Observable<{ user: User; tokens: AuthTokens }> {
    return this.api.post<{ user: User; tokens: AuthTokens }>('/auth/login', credentials).pipe(
      tap((response) => {
        this.storeTokens(response.tokens);
        this._currentUser.set(response.user);
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
      tap((tokens) => this.storeTokens(tokens)),
    );
  }

  setCurrentUser(user: User): void {
    this._currentUser.set(user);
  }

  private storeTokens(tokens: AuthTokens): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  }
}

