import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '@core/services/api.service';
import { RentalContract, PaginatedResponse } from '@shared/models/entities.model';
import PageHeaderComponent from '@shared/components/page-header/page-header';
import CurrencyBrlPipe from '@shared/pipes/currency-brl.pipe';

@Component({
  selector: 'lync-minhas-reservas',
  imports: [PageHeaderComponent, CurrencyBrlPipe],
  templateUrl: './minhas-reservas.html',
  styleUrl: './minhas-reservas.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class MinhasReservasComponent {
  private readonly api = inject(ApiService);

  readonly contracts = signal<RentalContract[]>([]);
  readonly loading   = signal(true);

  readonly statusLabel: Record<string, string> = {
    RESERVADO: 'Reservado', ATIVO: 'Ativo', ENCERRADO: 'Encerrado', CANCELADO: 'Cancelado',
  };
  readonly statusClass: Record<string, string> = {
    RESERVADO: 'badge--warning', ATIVO: 'badge--operador', ENCERRADO: 'badge--inactive', CANCELADO: 'badge--danger',
  };

  constructor() {
    this.api.get<PaginatedResponse<RentalContract>>('/portal/my-contracts').pipe(takeUntilDestroyed()).subscribe({
      next: (r) => { this.contracts.set(r.data); this.loading.set(false); },
      error: ()  => this.loading.set(false),
    });
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}
