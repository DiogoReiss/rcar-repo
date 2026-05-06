import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { Customer } from '@shared/models/entities.model';

@Injectable({ providedIn: 'root' })
export class ClientesService {
  private readonly api = inject(ApiService);

  readonly clientes = signal<Customer[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  async load(search?: string) {
    this.loading.set(true);
    this.error.set(null);
    try {
      const path = search ? `/customers?search=${encodeURIComponent(search)}` : '/customers';
      const res = await firstValueFrom(this.api.get<Customer[]>(path));
      this.clientes.set(res);
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

