import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { Vehicle } from '@shared/models/entities.model';

@Injectable({ providedIn: 'root' })
export class FrotaService {
  private readonly api = inject(ApiService);

  readonly veiculos = signal<Vehicle[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  async load(status?: string) {
    this.loading.set(true);
    this.error.set(null);
    try {
      const path = status ? `/fleet?status=${status}` : '/fleet';
      const res = await firstValueFrom(this.api.get<Vehicle[]>(path));
      this.veiculos.set(res);
    } catch {
      this.error.set('Erro ao carregar frota.');
    } finally {
      this.loading.set(false);
    }
  }

  async create(data: Omit<Vehicle, 'id' | 'createdAt'>) {
    const res = await firstValueFrom(this.api.post<Vehicle>('/fleet', data));
    this.veiculos.update(v => [...v, res]);
    return res;
  }

  async update(id: string, data: Partial<Vehicle>) {
    const res = await firstValueFrom(this.api.patch<Vehicle>(`/fleet/${id}`, data));
    this.veiculos.update(v => v.map(x => x.id === id ? res : x));
    return res;
  }

  async remove(id: string) {
    await firstValueFrom(this.api.delete(`/fleet/${id}`));
    this.veiculos.update(v => v.filter(x => x.id !== id));
  }
}

