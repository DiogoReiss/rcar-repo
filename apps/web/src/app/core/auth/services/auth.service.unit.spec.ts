import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        AuthService,
      ],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('isAuthenticated should be false when not logged in', () => {
    expect(service.isAuthenticated()).toBe(false);
  });

  it('login should store user profile and set isAuthenticated', () => {
    const mockResponse = {
      user: { id: '1', nome: 'Admin', email: 'admin@test.com', role: 'GESTOR_GERAL', ativo: true },
      accessToken: 'access',
      refreshToken: 'refresh',
    };

    service.login({ email: 'admin@test.com', senha: 'pass' }).subscribe(res => {
      expect(res.user.email).toBe('admin@test.com');
      expect(service.isAuthenticated()).toBe(true);
      expect(service.currentUser()?.email).toBe('admin@test.com');
    });

    const req = httpMock.expectOne(r => r.url.includes('/auth/login'));
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('register should call auth/register endpoint', () => {
    service.register({ nome: 'Maria', email: 'maria@test.com', senha: 'senha1234' }).subscribe((res) => {
      expect(res.message).toContain('Conta criada');
    });

    const req = httpMock.expectOne((r) => r.url.includes('/auth/register'));
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'Conta criada com sucesso.', user: { id: 'u10' } });
  });

  it('logout should clear user and redirect', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    service.logout();

    const req = httpMock.expectOne(r => r.url.includes('/auth/logout'));
    req.flush({});

    expect(service.isAuthenticated()).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith(['/auth/login']);
  });

  it('getAccessToken should return null (S5: tokens in httpOnly cookies)', () => {
    expect(service.getAccessToken()).toBeNull();
  });

  it('restores user from localStorage on init', () => {
    const user = { id: '1', nome: 'Test', email: 't@t.com', role: 'OPERADOR', ativo: true };
    localStorage.setItem('rcar_user_profile', JSON.stringify(user));

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        AuthService,
      ],
    });
    const freshService = TestBed.inject(AuthService);
    expect(freshService.isAuthenticated()).toBe(true);
    expect(freshService.currentUser()?.email).toBe('t@t.com');
  });
});

