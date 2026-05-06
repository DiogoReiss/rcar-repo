import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { User } from '@shared/models/entities.model';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly api = inject(ApiService);

  readonly users = signal<User[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  async load() {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(this.api.get<User[]>('/users'));
      this.users.set(res);
    } catch {
      this.error.set('Erro ao carregar usuários.');
    } finally {
      this.loading.set(false);
    }
  }

  async create(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { senha: string }) {
    const res = await firstValueFrom(this.api.post<User>('/users', data));
    this.users.update(u => [...u, res]);
    return res;
  }

  async update(id: string, data: Partial<User> & { senha?: string }) {
    const res = await firstValueFrom(this.api.patch<User>(`/users/${id}`, data));
    this.users.update(u => u.map(x => x.id === id ? res : x));
    return res;
  }

  async remove(id: string) {
    await firstValueFrom(this.api.delete(`/users/${id}`));
    this.users.update(u => u.filter(x => x.id !== id));
  }
}

