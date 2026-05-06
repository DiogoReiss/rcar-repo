import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap, finalize, map } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { WashService as WashServiceModel } from '@shared/models/entities.model';

@Injectable({ providedIn: 'root' })
export class ServicosService {
  private readonly api = inject(ApiService);

  readonly servicos = signal<WashServiceModel[]>([]);
  readonly loading  = signal(false);

  // A12: Returns Observable — callers use takeUntilDestroyed
  load(includeInactive = false): Observable<WashServiceModel[]> {
    const path = includeInactive ? '/wash/services?includeInactive=true' : '/wash/services';
    this.loading.set(true);
    return this.api.get<unknown>(path).pipe(
      tap((res) => {
        const items = Array.isArray(res) ? (res as WashServiceModel[]) : ((res as { data: WashServiceModel[] }).data ?? []);
        this.servicos.set(items);
      }),
      finalize(() => this.loading.set(false)),
      map(() => this.servicos()),
    );
  }

  create(data: Pick<WashServiceModel, 'nome' | 'descricao' | 'preco' | 'duracaoMin'>): Observable<WashServiceModel> {
    return this.api.post<WashServiceModel>('/wash/services', data).pipe(
      tap(res => this.servicos.update(s => [...s, res])),
    );
  }

  update(id: string, data: Partial<WashServiceModel>): Observable<WashServiceModel> {
    return this.api.patch<WashServiceModel>(`/wash/services/${id}`, data).pipe(
      tap(res => this.servicos.update(s => s.map(x => x.id === id ? res : x))),
    );
  }
}
