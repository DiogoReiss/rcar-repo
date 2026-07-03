import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import {
  Customer,
  WashQueueEntry,
  WashQueueStatus,
  WashService as WashServiceModel,
} from '@shared/models/entities.model';
import { AddToQueueInput, FilaService } from './fila.service';

const STATUS_ORDER: readonly WashQueueStatus[] = ['AGUARDANDO', 'EM_ATENDIMENTO', 'CONCLUIDO'];

/**
 * Deep facade for the wash-queue view. Owns the queue signal, the realtime SSE
 * connection, and the queue state machine (canAdvance/advance/advanceTo). Views
 * bind to the exposed read-only signals and dispatch intent through the async
 * methods; all sync and orchestration logic lives here.
 *
 * Provided at the component level so the SSE connection is torn down with the
 * view that opened it.
 */
@Injectable()
export class FilaQueueFacade {
  private readonly fila = inject(FilaService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _queue = signal<WashQueueEntry[]>([]);
  private readonly _services = signal<WashServiceModel[]>([]);
  private readonly _customers = signal<Customer[]>([]);
  private readonly _loading = signal(false);
  private readonly _lastUpdate = signal('');
  private readonly _sseError = signal(false);

  readonly queue = this._queue.asReadonly();
  readonly services = this._services.asReadonly();
  readonly customers = this._customers.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly lastUpdate = this._lastUpdate.asReadonly();
  readonly sseError = this._sseError.asReadonly();

  readonly aguardando = computed(() => this._queue().filter((q) => q.status === 'AGUARDANDO'));
  readonly emAtendimento = computed(() => this._queue().filter((q) => q.status === 'EM_ATENDIMENTO'));
  readonly concluidos = computed(() => this._queue().filter((q) => q.status === 'CONCLUIDO'));

  /** Loads reference data and the queue, then opens the realtime stream. */
  init(): void {
    this.fila
      .fetchServices()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (res) => this._services.set(res.data) });
    this.fila
      .fetchCustomers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (res) => this._customers.set(res.data ?? []) });
    void this.reload();
    this.connectStream();
  }

  async reload(): Promise<void> {
    this._loading.set(true);
    try {
      this._queue.set(await firstValueFrom(this.fila.fetchQueue()));
    } finally {
      this._loading.set(false);
    }
  }

  private connectStream(): void {
    this.fila
      .connectStream()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (payload) => {
          if (payload?.queue) this._queue.set(payload.queue);
          else void this.reload();
          this._lastUpdate.set(new Date().toLocaleTimeString('pt-BR'));
          this._sseError.set(false);
        },
        error: () => this._sseError.set(true),
      });
  }

  // ─── State machine ────────────────────────────────────────────────
  canAdvance(status: WashQueueStatus | undefined): boolean {
    return status === 'AGUARDANDO' || status === 'EM_ATENDIMENTO';
  }

  canPay(status: WashQueueStatus | undefined): boolean {
    return status === 'EM_ATENDIMENTO';
  }

  entry(id: string): WashQueueEntry | undefined {
    return this._queue().find((q) => q.id === id);
  }

  async advance(id: string): Promise<void> {
    await firstValueFrom(this.fila.advance(id));
    await this.reload();
  }

  /**
   * Advances an entry forward to a target column (drag-and-drop).
   * No-ops for same/backwards moves. Returns true when the entry moved.
   */
  async advanceTo(id: string, fromStatus: string, toStatus: string): Promise<boolean> {
    const fromIdx = STATUS_ORDER.indexOf(fromStatus as WashQueueStatus);
    const toIdx = STATUS_ORDER.indexOf(toStatus as WashQueueStatus);
    if (toIdx <= fromIdx || fromIdx < 0 || toIdx < 0) return false;
    for (let i = fromIdx; i < toIdx; i++) {
      await firstValueFrom(this.fila.advance(id));
    }
    await this.reload();
    return true;
  }

  async add(input: AddToQueueInput): Promise<void> {
    await firstValueFrom(this.fila.addToQueue(input));
    await this.reload();
  }

  async pay(id: string, metodo: string): Promise<void> {
    await firstValueFrom(this.fila.pay(id, metodo));
    await this.reload();
  }
}
