import { ChangeDetectionStrategy, Component, inject, signal, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom, Subscription } from 'rxjs';
import { MessageService } from 'primeng/api';
import { Dialog } from 'primeng/dialog';
import { FilaService } from '../fila.service';
import { PaymentMethod, WashQueueEntry } from '@shared/models/entities.model';
import PageHeaderComponent from '@shared/components/page-header/page-header';
import PaymentDialogComponent from '@shared/components/payment-dialog/payment-dialog';
import AppButtonComponent from '@shared/components/app-button/app-button';
import CurrencyBrlPipe from '@shared/pipes/currency-brl.pipe';

const STATUS_ORDER = ['AGUARDANDO', 'EM_ATENDIMENTO', 'CONCLUIDO'] as const;

@Component({
  selector: 'lync-fila-painel',
  imports: [RouterLink, PageHeaderComponent, PaymentDialogComponent, Dialog, AppButtonComponent, CurrencyBrlPipe],
  templateUrl: './fila-painel.html',
  styleUrl: './fila-painel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class FilaPainelComponent implements OnDestroy {
  private readonly filaService = inject(FilaService);
  private readonly toast = inject(MessageService);
  private sseSub?: Subscription;

  readonly queue      = this.filaService.queue;
  readonly loading    = this.filaService.loading;
  readonly lastUpdate = signal('');
  readonly sseError   = signal(false);

  // Detail dialog
  readonly detailItem = signal<WashQueueEntry | null>(null);

  // Payment dialog
  readonly payingId   = signal<string | null>(null);
  readonly payLoading = signal(false);

  // Drag state
  private draggedId     = '';
  private draggedStatus = '';
  readonly dragOverCol  = signal<string | null>(null);

  readonly aguardando    = () => this.queue().filter(q => q.status === 'AGUARDANDO');
  readonly emAtendimento = () => this.queue().filter(q => q.status === 'EM_ATENDIMENTO');
  readonly concluidos    = () => this.queue().filter(q => q.status === 'CONCLUIDO');

  constructor() {
    this.filaService.loadServices().pipe(takeUntilDestroyed()).subscribe();
    this.filaService.loadQueue().pipe(takeUntilDestroyed()).subscribe();
    this.connectSSE();
  }

  ngOnDestroy() { this.sseSub?.unsubscribe(); }

  private connectSSE() {
    this.sseSub = this.filaService.connectStream().subscribe({
      next: (payload) => {
        if (payload?.queue) this.filaService.queue.set(payload.queue);
        else this.filaService.loadQueue().pipe(takeUntilDestroyed()).subscribe();
        this.lastUpdate.set(new Date().toLocaleTimeString('pt-BR'));
        this.sseError.set(false);
      },
      error: () => this.sseError.set(true),
    });
  }

  // ─── Detail dialog ────────────────────────────────────────────────
  openDetail(q: WashQueueEntry) { this.detailItem.set(q); }
  closeDetail()                 { this.detailItem.set(null); }

  get detailCanAdvance(): boolean {
    const s = this.detailItem()?.status;
    return s === 'AGUARDANDO' || s === 'EM_ATENDIMENTO';
  }

  get detailCanPay(): boolean {
    return this.detailItem()?.status === 'EM_ATENDIMENTO';
  }

  async onAdvanceDetail() {
    const item = this.detailItem();
    if (!item) return;
    await this.onAdvance(item.id);
    // Sync detail item with updated queue
    const updated = this.queue().find(q => q.id === item.id);
    if (updated) this.detailItem.set(updated); else this.closeDetail();
  }

  openPayFromDetail() {
    const item = this.detailItem();
    if (item) { this.payingId.set(item.id); this.closeDetail(); }
  }

  // ─── Queue actions ────────────────────────────────────────────────
  async onAdvance(id: string) {
    await firstValueFrom(this.filaService.advance(id));
    await firstValueFrom(this.filaService.loadQueue());
    this.toast.add({ severity: 'success', summary: 'Status atualizado', life: 3000 });
  }

  async onPay(metodo: PaymentMethod) {
    const id = this.payingId();
    if (!id) return;
    this.payLoading.set(true);
    try {
      await firstValueFrom(this.filaService.pay(id, metodo));
      this.payingId.set(null);
      this.toast.add({ severity: 'success', summary: 'Pagamento registrado', life: 3000 });
      await firstValueFrom(this.filaService.loadQueue());
    } finally {
      this.payLoading.set(false);
    }
  }

  // ─── Drag & drop ─────────────────────────────────────────────────
  onDragStart(event: DragEvent, q: WashQueueEntry) {
    this.draggedId     = q.id;
    this.draggedStatus = q.status;
    event.dataTransfer!.effectAllowed = 'move';
  }

  onDragOver(event: DragEvent, col: string) {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
    this.dragOverCol.set(col);
  }

  onDragLeave() { this.dragOverCol.set(null); }

  async onDrop(event: DragEvent, targetStatus: string) {
    event.preventDefault();
    this.dragOverCol.set(null);
    const fromIdx = STATUS_ORDER.indexOf(this.draggedStatus as typeof STATUS_ORDER[number]);
    const toIdx   = STATUS_ORDER.indexOf(targetStatus   as typeof STATUS_ORDER[number]);
    if (toIdx <= fromIdx || fromIdx < 0 || toIdx < 0) return; // no-op for backwards/same
    // advance N steps
    for (let i = fromIdx; i < toIdx; i++) {
      await firstValueFrom(this.filaService.advance(this.draggedId));
    }
    await firstValueFrom(this.filaService.loadQueue());
    this.toast.add({ severity: 'success', summary: 'Status atualizado', life: 3000 });
    this.draggedId = this.draggedStatus = '';
  }

  // ─── Formatters ───────────────────────────────────────────────────
  formatEntryTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  readonly statusLabel: Record<string, string> = {
    AGUARDANDO: 'Aguardando', EM_ATENDIMENTO: 'Em Atendimento', CONCLUIDO: 'Concluído',
  };
  readonly statusBadgeClass: Record<string, string> = {
    AGUARDANDO: 'badge--warning', EM_ATENDIMENTO: 'badge--operador', CONCLUIDO: 'badge--success',
  };
}
