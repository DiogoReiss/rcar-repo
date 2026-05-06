import { ChangeDetectionStrategy, Component, inject, signal, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom, Subscription } from 'rxjs';
import { MessageService } from 'primeng/api';
import { FilaService } from '../fila.service';
import { PaymentMethod } from '@shared/models/entities.model';
import PageHeaderComponent from '@shared/components/page-header/page-header';
import AppButtonComponent from '@shared/components/app-button/app-button';
import PaymentDialogComponent from '@shared/components/payment-dialog/payment-dialog';

@Component({
  selector: 'lync-fila-painel',
  imports: [RouterLink, PageHeaderComponent, AppButtonComponent, PaymentDialogComponent],
  templateUrl: './fila-painel.html',
  styleUrl: './fila-painel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class FilaPainelComponent implements OnDestroy {
  private readonly filaService = inject(FilaService);
  private readonly toast = inject(MessageService);
  private sseSub?: Subscription;

  readonly queue      = this.filaService.queue;
  readonly services   = this.filaService.services;
  readonly loading    = this.filaService.loading;

  readonly lastUpdate = signal('');
  readonly sseError   = signal(false);

  // Payment dialog
  readonly payingId   = signal<string | null>(null);
  readonly payLoading = signal(false);

  readonly statusLabel: Record<string, string> = {
    AGUARDANDO: 'Aguardando', EM_ATENDIMENTO: 'Em Atendimento', CONCLUIDO: 'Concluído',
  };

  readonly aguardando    = () => this.queue().filter(q => q.status === 'AGUARDANDO');
  readonly emAtendimento = () => this.queue().filter(q => q.status === 'EM_ATENDIMENTO');

  constructor() {
    this.filaService.loadServices().pipe(takeUntilDestroyed()).subscribe();
    this.filaService.loadQueue().pipe(takeUntilDestroyed()).subscribe();
    this.connectSSE();
  }

  ngOnDestroy() { this.sseSub?.unsubscribe(); }

  private connectSSE() {
    this.sseSub = this.filaService.connectStream().subscribe({
      next: (payload) => {
        if (payload?.queue) {
          this.filaService.queue.set(payload.queue);
        } else {
          this.filaService.loadQueue().pipe(takeUntilDestroyed()).subscribe();
        }
        this.lastUpdate.set(new Date().toLocaleTimeString('pt-BR'));
        this.sseError.set(false);
      },
      error: () => this.sseError.set(true),
    });
  }

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
}
