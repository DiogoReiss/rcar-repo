import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap, finalize, map } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { Vehicle } from '@shared/models/entities.model';

@Injectable({ providedIn: 'root' })
export class FrotaService {
  private readonly api = inject(ApiService);

  readonly veiculos = signal<Vehicle[]>([]);
  readonly loading  = signal(false);

  // A12/A18: Returns Observable — callers use takeUntilDestroyed for lifecycle management
  load(status?: string): Observable<Vehicle[]> {
    const path = status ? `/fleet?status=${status}` : '/fleet';
    this.loading.set(true);
    return this.api.get<unknown>(path).pipe(
      tap((res) => {
        const items = Array.isArray(res) ? (res as Vehicle[]) : ((res as { data: Vehicle[] }).data ?? []);
        this.veiculos.set(items);
      }),
      finalize(() => this.loading.set(false)),
      map(() => this.veiculos()),
    );
  }

  create(data: Omit<Vehicle, 'id' | 'createdAt'>): Observable<Vehicle> {
    return this.api.post<Vehicle>('/fleet', data).pipe(
      tap(res => this.veiculos.update(v => [...v, res])),
    );
  }

  update(id: string, data: Partial<Vehicle>): Observable<Vehicle> {
    return this.api.patch<Vehicle>(`/fleet/${id}`, data).pipe(
      tap(res => this.veiculos.update(v => v.map(x => x.id === id ? res : x))),
    );
  }

  remove(id: string): Observable<unknown> {
    return this.api.delete(`/fleet/${id}`).pipe(
      tap(() => this.veiculos.update(v => v.filter(x => x.id !== id))),
    );
  }
}
