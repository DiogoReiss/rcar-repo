import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ApiService } from './api.service';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ApiService,
      ],
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('get() should call the correct URL', () => {
    service.get('/test').subscribe();
    const req = httpMock.expectOne(r => r.url.includes('/test'));
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('post() should call the correct URL with body', () => {
    service.post('/test', { key: 'value' }).subscribe();
    const req = httpMock.expectOne(r => r.url.includes('/test'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ key: 'value' });
    req.flush({});
  });

  it('patch() should call the correct URL with body', () => {
    service.patch('/test/1', { key: 'updated' }).subscribe();
    const req = httpMock.expectOne(r => r.url.includes('/test/1'));
    expect(req.request.method).toBe('PATCH');
    req.flush({});
  });

  it('delete() should call the correct URL', () => {
    service.delete('/test/1').subscribe();
    const req = httpMock.expectOne(r => r.url.includes('/test/1'));
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });
});

