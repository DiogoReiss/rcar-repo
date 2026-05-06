import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap, finalize } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { SseService } from '@core/services/sse.service';
import {
  WashQueueEntry,
  WashService as WashServiceModel,
  PaginatedResponse,
} from '@shared/models/entities.model';

@Injectable({ providedIn: 'root' })
export class FilaService {
  private readonly api = inject(ApiService);
  private readonly sse = inject(SseService);

  readonly queue = signal<WashQueueEntry[]>([]);
  readonly services = signal<WashServiceModel[]>([]);
  readonly loading = signal(false);

  loadServices(): Observable<PaginatedResponse<WashServiceModel>> {
    return this.api.get<PaginatedResponse<WashServiceModel>>('/wash/services').pipe(
      tap((res) => this.services.set(res.data)),
    );
  }

  loadQueue(): Observable<WashQueueEntry[]> {
    this.loading.set(true);
    return this.api.get<WashQueueEntry[]>('/lavajato/queue').pipe(
      tap((res) => this.queue.set(res)),
      finalize(() => this.loading.set(false)),
    );
  }

  addToQueue(data: {
    nomeAvulso?: string;
    customerId?: string;
    serviceId: string;
    veiculoPlaca?: string;
  }): Observable<WashQueueEntry> {
    return this.api.post<WashQueueEntry>('/lavajato/queue', data);
  }

  advance(id: string): Observable<WashQueueEntry> {
    return this.api.patch<WashQueueEntry>(`/lavajato/queue/${id}/advance`, {});
  }

  pay(id: string, metodo: string): Observable<unknown> {
    return this.api.post(`/lavajato/queue/${id}/payment`, { metodo });
  }

  /** Realtime queue updates via SSE */
  connectStream(): Observable<{ queue: WashQueueEntry[]; ts: string }> {
    return this.sse.connect<{ queue: WashQueueEntry[]; ts: string }>('/lavajato/queue/stream');
  }
}

