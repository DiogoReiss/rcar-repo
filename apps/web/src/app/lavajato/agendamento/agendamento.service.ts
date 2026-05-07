import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap, finalize } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import {
  WashSchedule, WashService as WashServiceModel,
  PaginatedResponse, AvailabilityResponse,
} from '@shared/models/entities.model';

@Injectable({ providedIn: 'root' })
export class AgendamentoService {
  private readonly api = inject(ApiService);

  readonly schedules    = signal<WashSchedule[]>([]);
  readonly services     = signal<WashServiceModel[]>([]);
  readonly loading      = signal(false);
  readonly monthSummary = signal<Record<string, number>>({});

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

  /** Fetch schedules for a single date without touching the shared signal (used by week view). */
  fetchSchedules(date: string): Observable<WashSchedule[]> {
    return this.api.get<WashSchedule[]>(`/lavajato/schedules?date=${date}`);
  }

  /** Fetch all schedules for a month (YYYY-MM) and populate monthSummary signal. */
  loadMonthSummary(month: string): Observable<WashSchedule[]> {
    return this.api.get<WashSchedule[]>(`/lavajato/schedules?month=${month}`).pipe(
      tap((schedules) => {
        const summary: Record<string, number> = {};
        schedules.forEach(s => {
          const date = (s.dataHora as string).slice(0, 10);
          summary[date] = (summary[date] ?? 0) + 1;
        });
        this.monthSummary.set(summary);
      }),
    );
  }

  /** Fetch available time slots for a date + service combination. */
  fetchAvailability(date: string, serviceId?: string): Observable<AvailabilityResponse> {
    const q = serviceId ? `?date=${date}&serviceId=${serviceId}` : `?date=${date}`;
    return this.api.get<AvailabilityResponse>(`/lavajato/schedules/availability${q}`);
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

