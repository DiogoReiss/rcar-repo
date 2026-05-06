import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { Customer, PaginatedResponse } from '@shared/models/entities.model';

@Injectable({ providedIn: 'root' })
export class ClientesService {
  private readonly api = inject(ApiService);

  readonly clientes = signal<Customer[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly total = signal(0);

  async load(search?: string, page = 1, perPage = 50) {
    this.loading.set(true);
    this.error.set(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      params.set('page', String(page));
      params.set('perPage', String(perPage));
      const res = await firstValueFrom(
        this.api.get<PaginatedResponse<Customer>>(`/customers?${params.toString()}`),
      );
      this.clientes.set(res.data);
      this.total.set(res.total);
    } catch {
      this.error.set('Erro ao carregar clientes.');
    } finally {
      this.loading.set(false);
    }
  }

  async create(data: Omit<Customer, 'id' | 'ativo' | 'createdAt'>) {
    const res = await firstValueFrom(this.api.post<Customer>('/customers', data));
    this.clientes.update(c => [...c, res]);
    return res;
  }

  async update(id: string, data: Partial<Customer>) {
    const res = await firstValueFrom(this.api.patch<Customer>(`/customers/${id}`, data));
    this.clientes.update(c => c.map(x => x.id === id ? res : x));
    return res;
  }
}
