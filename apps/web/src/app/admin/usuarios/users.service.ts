import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap, finalize } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { User } from '@shared/models/entities.model';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly api = inject(ApiService);

  readonly users   = signal<User[]>([]);
  readonly loading = signal(false);

  // A12: Returns Observable — callers use takeUntilDestroyed
  load(): Observable<User[]> {
    this.loading.set(true);
    return this.api.get<User[]>('/users').pipe(
      tap(res => this.users.set(res)),
      finalize(() => this.loading.set(false)),
    );
  }

  create(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { senha: string }): Observable<User> {
    return this.api.post<User>('/users', data).pipe(
      tap(res => this.users.update(u => [...u, res])),
    );
  }

  update(id: string, data: Partial<User> & { senha?: string }): Observable<User> {
    return this.api.patch<User>(`/users/${id}`, data).pipe(
      tap(res => this.users.update(u => u.map(x => x.id === id ? res : x))),
    );
  }

  remove(id: string): Observable<unknown> {
    return this.api.delete(`/users/${id}`).pipe(
      tap(() => this.users.update(u => u.filter(x => x.id !== id))),
    );
  }
}
