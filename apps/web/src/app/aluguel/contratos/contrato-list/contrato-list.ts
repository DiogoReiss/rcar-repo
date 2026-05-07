import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import type { RowMenuItem } from '@shared/components/row-menu/row-menu';
import { ApiService } from '@core/services/api.service';
import { firstValueFrom } from 'rxjs';
import { RentalContract, PaginatedResponse, PaymentMethod } from '@shared/models/entities.model';
import ConfirmDialogComponent from '@shared/components/confirm-dialog/confirm-dialog';
import EntityDialogComponent from '@shared/components/entity-dialog/entity-dialog';
import FormFieldComponent from '@shared/components/form-field/form-field';
import PaymentDialogComponent from '@shared/components/payment-dialog/payment-dialog';
import PageHeaderComponent from '@shared/components/page-header/page-header';
import RowMenuComponent from '@shared/components/row-menu/row-menu';

@Component({
  selector: 'lync-contrato-list',
  imports: [FormsModule, RouterLink, ConfirmDialogComponent, EntityDialogComponent, FormFieldComponent, PaymentDialogComponent, PageHeaderComponent, RowMenuComponent],
  templateUrl: './contrato-list.html',
  styleUrl: './contrato-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ContratoListComponent implements OnInit {
  private readonly api    = inject(ApiService);
  private readonly toast  = inject(MessageService);
  private readonly router = inject(Router);

  readonly contracts    = signal<RentalContract[]>([]);
  readonly loading      = signal(false);
  readonly error        = signal<string | null>(null);
  readonly statusFilter = signal('');

  // Abertura dialog
  readonly aberturaTarget    = signal<string | null>(null);
  readonly aberturaLoading   = signal(false);
  readonly kmRetirada        = signal(0);
  readonly combustivelSaida  = signal('CHEIO');

  // Payment dialog
  readonly payingId   = signal<string | null>(null);
  readonly payLoading = signal(false);

  // Cancel confirm
  readonly cancelTarget = signal<string | null>(null);

  readonly statusLabel: Record<string, string> = { RESERVADO: 'Reservado', ATIVO: 'Ativo', ENCERRADO: 'Encerrado', CANCELADO: 'Cancelado' };
  readonly statusClass:  Record<string, string> = { RESERVADO: 'badge--warning', ATIVO: 'badge--success', ENCERRADO: 'badge--inactive', CANCELADO: 'badge--danger' };

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

  getRowMenuItems(c: RentalContract): RowMenuItem[] {
    const items: RowMenuItem[] = [];
    if (c.status === 'RESERVADO') {
      items.push(
        { label: 'Abertura',  icon: 'pi pi-play',       command: () => { this.aberturaTarget.set(c.id); this.kmRetirada.set(0); this.combustivelSaida.set('CHEIO'); } },
        { label: 'Cancelar',  icon: 'pi pi-times-circle', danger: true, command: () => this.cancelTarget.set(c.id) },
      );
    }
    if (c.status === 'ATIVO') {
      items.push(
        { label: 'Devolução', icon: 'pi pi-undo', command: () => this.router.navigate(['/aluguel/devolucao', c.id]) },
        { label: 'Pagar',     icon: 'pi pi-credit-card',  command: () => this.payingId.set(c.id) },
      );
    }
    return items;
  }

  async onAbertura() {
    const id = this.aberturaTarget();
    if (!id) return;
    this.aberturaLoading.set(true);
    try {
      await firstValueFrom(this.api.patch(`/rental/contracts/${id}/open`, {
        kmRetirada: this.kmRetirada(),
        combustivelSaida: this.combustivelSaida(),
        checklist: {},
      }));
      this.toast.add({ severity: 'success', summary: 'Contrato aberto', life: 3000 });
      this.aberturaTarget.set(null);
      await this.load();
    } finally { this.aberturaLoading.set(false); }
  }

  async onConfirmCancel() {
    const id = this.cancelTarget();
    if (!id) return;
    this.cancelTarget.set(null);
    await firstValueFrom(this.api.patch(`/rental/contracts/${id}/cancel`, {}));
    this.toast.add({ severity: 'success', summary: 'Reserva cancelada', life: 3000 });
    await this.load();
  }

  async onPay(metodo: PaymentMethod) {
    const id = this.payingId();
    if (!id) return;
    this.payLoading.set(true);
    try {
      await firstValueFrom(this.api.post(`/rental/contracts/${id}/payment`, { metodo }));
      this.toast.add({ severity: 'success', summary: 'Pagamento registrado', life: 3000 });
      this.payingId.set(null);
      await this.load();
    } finally { this.payLoading.set(false); }
  }

  formatDate(d: string) { return new Date(d).toLocaleDateString('pt-BR'); }
  formatPrice(v: number) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v); }
  d4signClass(s: string) { return s === 'SIGNED' ? 'badge--success' : s === 'PENDING' ? 'badge--warning' : 'badge--inactive'; }
}
