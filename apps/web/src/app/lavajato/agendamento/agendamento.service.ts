import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap, finalize } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { WashSchedule, WashService as WashServiceModel, PaginatedResponse } from '@shared/models/entities.model';

@Injectable({ providedIn: 'root' })
export class AgendamentoService {
  private readonly api = inject(ApiService);

  readonly schedules = signal<WashSchedule[]>([]);
  readonly services = signal<WashServiceModel[]>([]);
  readonly loading = signal(false);

  loadServices(): Observable<PaginatedResponse<WashServiceModel>> {
    return this.api.get<PaginatedResponse<WashServiceModel>>('/wash/services').pipe(
      tap((res) => this.services.set(res.data)),
    );
  }

  loadSchedules(date: string): Observable<WashSchedule[]> {
    this.loading.set(true);
    return this.api.get<WashSchedule[]>(`/lavajato/schedules?date=${date}`).pipe(
      tap((res) => this.schedules.set(res)),
      finalize(() => this.loading.set(false)),
    );
  }

  create(data: {
    nomeAvulso?: string;
    customerId?: string;
    telefone?: string;
    serviceId: string;
    dataHora: string;
    observacoes?: string;
  }): Observable<WashSchedule> {
    return this.api.post<WashSchedule>('/lavajato/schedules', data);
  }

  updateStatus(id: string, status: string): Observable<WashSchedule> {
    return this.api.patch<WashSchedule>(`/lavajato/schedules/${id}/status`, { status });
  }

  cancel(id: string): Observable<WashSchedule> {
    return this.api.delete<WashSchedule>(`/lavajato/schedules/${id}`);
  }

  pay(id: string, metodo: string): Observable<unknown> {
    return this.api.post(`/lavajato/schedules/${id}/payment`, { metodo });
  }
}

