import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '@core/services/api.service';
import { firstValueFrom } from 'rxjs';
import { RentalContract, PaginatedResponse } from '@shared/models/entities.model';
import ConfirmDialogComponent from '@shared/components/confirm-dialog/confirm-dialog';
import PageHeaderComponent from '@shared/components/page-header/page-header';

@Component({
  selector: 'lync-contrato-list',
  imports: [FormsModule, RouterLink, ConfirmDialogComponent, PageHeaderComponent],
  templateUrl: './contrato-list.html',
  styleUrl: './contrato-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ContratoListComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly contracts = signal<RentalContract[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly statusFilter = signal('');

  // Open contract (vistoria saída)
  readonly openingId = signal<string | null>(null);
  readonly kmRetirada = signal(0);
  readonly combustivelSaida = signal('CHEIO');

  // Payment
  readonly payingId = signal<string | null>(null);
  readonly payMethod = signal('PIX');
  // A6: Replace confirm() with accessible dialog
  readonly cancelTarget = signal<string | null>(null);

  readonly statusLabel: Record<string, string> = { RESERVADO: 'Reservado', ATIVO: 'Ativo', ENCERRADO: 'Encerrado', CANCELADO: 'Cancelado' };
  readonly statusClass: Record<string, string> = { RESERVADO: 'badge--warning', ATIVO: 'badge--success', ENCERRADO: 'badge--inactive', CANCELADO: 'badge--danger' };

  ngOnInit() { this.load(); }

  async load() {
    this.loading.set(true); this.error.set(null);
    try {
      const path = this.statusFilter() ? `/rental/contracts?status=${this.statusFilter()}` : '/rental/contracts';
      const res = await firstValueFrom(this.api.get<PaginatedResponse<RentalContract>>(path));
      this.contracts.set(res.data);
    } catch { this.error.set('Erro ao carregar contratos.'); }
    finally { this.loading.set(false); }
  }

  async onOpenContract(id: string) {
    await firstValueFrom(this.api.patch(`/rental/contracts/${id}/open`, {
      kmRetirada: this.kmRetirada(),
      combustivelSaida: this.combustivelSaida(),
      checklist: {},
    }));
    this.openingId.set(null);
    await this.load();
  }

  onCancelClick(id: string) {
    this.cancelTarget.set(id);
  }

  async onConfirmCancel() {
    const id = this.cancelTarget();
    if (!id) return;
    this.cancelTarget.set(null);
    await firstValueFrom(this.api.patch(`/rental/contracts/${id}/cancel`, {}));
    await this.load();
  }

  async onPay(id: string) {
    await firstValueFrom(this.api.post(`/rental/contracts/${id}/payment`, { metodo: this.payMethod() }));
    this.payingId.set(null);
    await this.load();
  }

  formatDate(d: string) { return new Date(d).toLocaleDateString('pt-BR'); }
  formatPrice(v: number) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v); }
  d4signClass(s: string) { return s === 'SIGNED' ? 'badge--success' : s === 'PENDING' ? 'badge--warning' : 'badge--inactive'; }
}
