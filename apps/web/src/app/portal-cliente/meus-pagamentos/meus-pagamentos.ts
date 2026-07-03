import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MessageService } from 'primeng/api';
import { ApiService } from '@core/services/api.service';
import { Payment } from '@shared/models/entities.model';
import PageHeaderComponent from '@shared/components/page-header/page-header';

@Component({
  selector: 'lync-meus-pagamentos',
  imports: [PageHeaderComponent],
  templateUrl: './meus-pagamentos.html',
  styleUrl: './meus-pagamentos.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class MeusPagamentosComponent {
  private readonly api = inject(ApiService);
  private readonly toast = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  readonly payments = signal<Payment[]>([]);
  readonly loading = signal(true);

  readonly totalPago = computed(() =>
    this.payments()
      .filter((p) => p.status === 'CONFIRMADO')
      .reduce((sum, p) => sum + Number(p.valor), 0),
  );

  readonly totalPendente = computed(() =>
    this.payments()
      .filter((p) => p.status === 'PENDENTE')
      .reduce((sum, p) => sum + Number(p.valor), 0),
  );

  readonly statusLabel: Record<string, string> = {
    PENDENTE: 'Pendente',
    CONFIRMADO: 'Confirmado',
    CANCELADO: 'Cancelado',
  };

  readonly metodoLabel: Record<string, string> = {
    DINHEIRO: 'Dinheiro',
    PIX: 'Pix',
    CARTAO_CREDITO: 'Cartão de crédito',
    CARTAO_DEBITO: 'Cartão de débito',
    BOLETO: 'Boleto',
  };

  constructor() {
    this.api
      .get<Payment[]>('/portal/my-payments')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list) => {
          this.payments.set(list);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  baixarComprovante(p: Payment) {
    if (p.status !== 'CONFIRMADO') return;
    this.toast.add({
      severity: 'success',
      summary: 'Comprovante',
      detail: `Comprovante do pagamento ${p.id.toUpperCase()} enviado para seu e-mail.`,
      life: 4000,
    });
  }

  badgeModifier(status: string): string {
    if (status === 'CONFIRMADO') return 'operador';
    if (status === 'CANCELADO') return 'inactive';
    return 'warning';
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('pt-BR');
  }

  formatMoney(v: number): string {
    return Number(v).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }
}
