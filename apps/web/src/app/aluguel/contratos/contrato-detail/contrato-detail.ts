import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { RentalContract } from '@shared/models/entities.model';
import PageHeaderComponent from '@shared/components/page-header/page-header';
import CurrencyBrlPipe from '@shared/pipes/currency-brl.pipe';
import DateBrPipe from '@shared/pipes/date-br.pipe';

@Component({
  selector: 'lync-contrato-detail',
  imports: [RouterLink, PageHeaderComponent, CurrencyBrlPipe, DateBrPipe],
  templateUrl: './contrato-detail.html',
  styleUrl: './contrato-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ContratoDetailComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);

  readonly contract = signal<RentalContract | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly statusLabel: Record<string, string> = {
    RESERVADO: 'Reservado', ATIVO: 'Ativo', ENCERRADO: 'Encerrado', CANCELADO: 'Cancelado',
  };
  readonly statusClass: Record<string, string> = {
    RESERVADO: 'badge--warning', ATIVO: 'badge--success',
    ENCERRADO: 'badge--inactive', CANCELADO: 'badge--danger',
  };

  ngOnInit() { this.load(); }

  async load() {
    const id = this.route.snapshot.paramMap.get('id')!;
    try {
      const res = await firstValueFrom(this.api.get<RentalContract>(`/rental/contracts/${id}`));
      this.contract.set(res);
    } catch {
      this.error.set('Contrato não encontrado.');
    } finally {
      this.loading.set(false);
    }
  }
}

