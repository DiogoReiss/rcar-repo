import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { WashService as WashServiceModel } from '@shared/models/entities.model';

@Injectable({ providedIn: 'root' })
export class ServicosService {
  private readonly api = inject(ApiService);

  readonly servicos = signal<WashServiceModel[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  async load(includeInactive = false) {
    this.loading.set(true);
    this.error.set(null);
    try {
      const path = includeInactive ? '/wash/services?includeInactive=true' : '/wash/services';
      const res = await firstValueFrom(this.api.get<WashServiceModel[]>(path));
      this.servicos.set(res);
    } catch {
      this.error.set('Erro ao carregar serviços.');
    } finally {
      this.loading.set(false);
    }
  }

  async create(data: Pick<WashServiceModel, 'nome' | 'descricao' | 'preco' | 'duracaoMin'>) {
    const res = await firstValueFrom(this.api.post<WashServiceModel>('/wash/services', data));
    this.servicos.update(s => [...s, res]);
    return res;
  }

  async update(id: string, data: Partial<WashServiceModel>) {
    const res = await firstValueFrom(this.api.patch<WashServiceModel>(`/wash/services/${id}`, data));
    this.servicos.update(s => s.map(x => x.id === id ? res : x));
    return res;
  }
}

