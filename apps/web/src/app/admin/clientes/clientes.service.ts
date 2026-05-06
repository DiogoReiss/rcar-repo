import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap, finalize } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { Customer, PaginatedResponse } from '@shared/models/entities.model';

@Injectable({ providedIn: 'root' })
export class ClientesService {
  private readonly api = inject(ApiService);

  readonly clientes   = signal<Customer[]>([]);
  readonly loading    = signal(false);
  readonly total      = signal(0);
  readonly totalPages = signal(0);

  // A12/A13: Returns Observable — callers use takeUntilDestroyed
  load(search?: string, page = 1, perPage = 50): Observable<PaginatedResponse<Customer>> {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    params.set('page', String(page));
    params.set('perPage', String(perPage));
    this.loading.set(true);
    return this.api.get<PaginatedResponse<Customer>>(`/customers?${params.toString()}`).pipe(
      tap((res) => {
        this.clientes.set(res.data);
        this.total.set(res.total);
        this.totalPages.set(res.totalPages);
      }),
      finalize(() => this.loading.set(false)),
    );
  }

  create(data: Omit<Customer, 'id' | 'ativo' | 'createdAt'>): Observable<Customer> {
    return this.api.post<Customer>('/customers', data).pipe(
      tap(res => this.clientes.update(c => [...c, res])),
    );
  }

  update(id: string, data: Partial<Customer>): Observable<Customer> {
    return this.api.patch<Customer>(`/customers/${id}`, data).pipe(
      tap(res => this.clientes.update(c => c.map(x => x.id === id ? res : x))),
    );
  }
}
