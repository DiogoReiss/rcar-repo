import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { Customer, WashSchedule, RentalContract } from '@shared/models/entities.model';
import PageHeaderComponent from '@shared/components/page-header/page-header';
import CurrencyBrlPipe from '@shared/pipes/currency-brl.pipe';
import DateBrPipe from '@shared/pipes/date-br.pipe';

interface CustomerHistory {
  customer: Customer;
  schedules: WashSchedule[];
  contracts: RentalContract[];
}

@Component({
  selector: 'lync-cliente-detail',
  imports: [RouterLink, PageHeaderComponent, CurrencyBrlPipe, DateBrPipe],
  templateUrl: './cliente-detail.html',
  styleUrl: './cliente-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ClienteDetailComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);

  readonly data = signal<CustomerHistory | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly scheduleStatusClass: Record<string, string> = {
    AGENDADO: 'badge--warning', EM_ATENDIMENTO: 'badge--operador',
    CONCLUIDO: 'badge--success', CANCELADO: 'badge--inactive',
  };
  readonly contractStatusClass: Record<string, string> = {
    RESERVADO: 'badge--warning', ATIVO: 'badge--success',
    ENCERRADO: 'badge--inactive', CANCELADO: 'badge--danger',
  };

  ngOnInit() { this.load(); }

  async load() {
    const id = this.route.snapshot.paramMap.get('id')!;
    try {
      const res = await firstValueFrom(this.api.get<CustomerHistory>(`/customers/${id}/history`));
      this.data.set(res);
    } catch {
      // Fallback: load just the customer
      try {
        const c = await firstValueFrom(this.api.get<Customer>(`/customers/${id}`));
        this.data.set({ customer: c, schedules: [], contracts: [] });
      } catch {
        this.error.set('Cliente não encontrado.');
      }
    } finally {
      this.loading.set(false);
    }
  }
}

