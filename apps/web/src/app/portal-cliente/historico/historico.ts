import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { WashSchedule, RentalContract, PaginatedResponse } from '@shared/models/entities.model';
import PageHeaderComponent from '@shared/components/page-header/page-header';
import CurrencyBrlPipe from '@shared/pipes/currency-brl.pipe';

type HistoricoItem =
  | { kind: 'lavagem'; data: WashSchedule }
  | { kind: 'aluguel'; data: RentalContract };

@Component({
  selector: 'lync-historico',
  imports: [PageHeaderComponent, CurrencyBrlPipe],
  templateUrl: './historico.html',
  styleUrl: './historico.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class HistoricoComponent {
  private readonly api        = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  private readonly _schedules  = signal<WashSchedule[]>([]);
  private readonly _contracts  = signal<RentalContract[]>([]);

  readonly items = computed<HistoricoItem[]>(() => {
    const wash = this._schedules()
      .filter(s => s.status === 'CONCLUIDO' || s.status === 'CANCELADO')
      .map(s => ({ kind: 'lavagem' as const, data: s, _date: s.dataHora }));
    const rent = this._contracts()
      .filter(c => c.status === 'ENCERRADO' || c.status === 'CANCELADO')
      .map(c => ({ kind: 'aluguel' as const, data: c, _date: c.dataRetirada }));
    return [...wash, ...rent]
      .sort((a, b) => new Date(b._date).getTime() - new Date(a._date).getTime())
      .map(({ kind, data }) => ({ kind, data } as HistoricoItem));
  });

  constructor() {
    forkJoin({
      schedules: this.api.get<WashSchedule[]>('/portal/my-schedules'),
      contracts: this.api.get<PaginatedResponse<RentalContract>>('/portal/my-contracts'),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ schedules, contracts }) => {
        this._schedules.set(schedules);
        this._contracts.set(contracts.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  asSchedule(item: HistoricoItem): WashSchedule   { return item.data as WashSchedule; }
  asContract(item: HistoricoItem): RentalContract  { return item.data as RentalContract; }
}
