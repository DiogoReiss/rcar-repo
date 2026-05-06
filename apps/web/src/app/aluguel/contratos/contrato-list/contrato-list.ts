import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '@core/services/api.service';
import { firstValueFrom } from 'rxjs';
import { RentalContract } from '@shared/models/entities.model';

@Component({
  selector: 'lync-contrato-list',
  imports: [FormsModule, RouterLink],
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

  readonly statusLabel: Record<string, string> = { RESERVADO: 'Reservado', ATIVO: 'Ativo', ENCERRADO: 'Encerrado', CANCELADO: 'Cancelado' };
  readonly statusClass: Record<string, string> = { RESERVADO: 'badge--warning', ATIVO: 'badge--success', ENCERRADO: 'badge--inactive', CANCELADO: 'badge--danger' };

  ngOnInit() { this.load(); }

  async load() {
    this.loading.set(true); this.error.set(null);
    try {
      const path = this.statusFilter() ? `/rental/contracts?status=${this.statusFilter()}` : '/rental/contracts';
      const res = await firstValueFrom(this.api.get<RentalContract[]>(path));
      this.contracts.set(res);
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

  async onCancel(id: string) {
    if (!confirm('Cancelar esta reserva?')) return;
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
}
