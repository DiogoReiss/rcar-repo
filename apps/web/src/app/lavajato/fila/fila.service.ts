import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { SseService } from '@core/services/sse.service';
import {
  Customer,
  WashQueueEntry,
  WashService as WashServiceModel,
  PaginatedResponse,
} from '@shared/models/entities.model';

export interface AddToQueueInput {
  nomeAvulso?: string;
  customerId?: string;
  serviceId: string;
  veiculoPlaca?: string;
}

export interface QueueStreamEvent {
  queue: WashQueueEntry[];
  ts: string;
}

/**
 * Stateless HTTP/SSE gateway for the wash queue.
 * Queue state, realtime sync, and the queue state machine live in FilaQueueFacade.
 */
@Injectable({ providedIn: 'root' })
export class FilaService {
  private readonly api = inject(ApiService);
  private readonly sse = inject(SseService);

  fetchServices(): Observable<PaginatedResponse<WashServiceModel>> {
    return this.api.get<PaginatedResponse<WashServiceModel>>('/wash/services');
  }

  fetchQueue(): Observable<WashQueueEntry[]> {
    return this.api.get<WashQueueEntry[]>('/lavajato/queue');
  }

  fetchCustomers(): Observable<PaginatedResponse<Customer>> {
    return this.api.get<PaginatedResponse<Customer>>('/customers');
  }

  addToQueue(data: AddToQueueInput): Observable<WashQueueEntry> {
    return this.api.post<WashQueueEntry>('/lavajato/queue', data);
  }

  advance(id: string): Observable<WashQueueEntry> {
    return this.api.patch<WashQueueEntry>(`/lavajato/queue/${id}/advance`, {});
  }

  pay(id: string, metodo: string): Observable<unknown> {
    return this.api.post(`/lavajato/queue/${id}/payment`, { metodo });
  }

  /** Realtime queue updates via SSE. Caller unsubscribes to close the connection. */
  connectStream(): Observable<QueueStreamEvent> {
    return this.sse.connect<QueueStreamEvent>('/lavajato/queue/stream');
  }
}
