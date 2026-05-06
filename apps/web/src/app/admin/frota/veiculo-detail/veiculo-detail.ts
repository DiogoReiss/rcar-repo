import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { Vehicle } from '@shared/models/entities.model';
import PageHeaderComponent from '@shared/components/page-header/page-header';
import CurrencyBrlPipe from '@shared/pipes/currency-brl.pipe';
import DateBrPipe from '@shared/pipes/date-br.pipe';

interface VehicleDetail extends Vehicle {
  maintenances?: Array<{ id: string; descricao: string; custo: number; data: string }>;
  contracts?: Array<{
    id: string;
    status: string;
    dataRetirada: string;
    dataDevolucao: string;
    customer?: { nome: string };
  }>;
}

@Component({
  selector: 'lync-veiculo-detail',
  imports: [RouterLink, PageHeaderComponent, CurrencyBrlPipe, DateBrPipe],
  templateUrl: './veiculo-detail.html',
  styleUrl: './veiculo-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class VeiculoDetailComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);

  readonly vehicle = signal<VehicleDetail | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly statusLabel: Record<string, string> = {
    DISPONIVEL: 'Disponível', ALUGADO: 'Alugado',
    MANUTENCAO: 'Manutenção', INATIVO: 'Inativo',
  };
  readonly statusClass: Record<string, string> = {
    DISPONIVEL: 'badge--success', ALUGADO: 'badge--operador',
    MANUTENCAO: 'badge--warning', INATIVO: 'badge--inactive',
  };
  readonly contractStatusClass: Record<string, string> = {
    RESERVADO: 'badge--warning', ATIVO: 'badge--success',
    ENCERRADO: 'badge--inactive', CANCELADO: 'badge--danger',
  };

  ngOnInit() { this.load(); }

  async load() {
    const id = this.route.snapshot.paramMap.get('id')!;
    try {
      const res = await firstValueFrom(this.api.get<VehicleDetail>(`/fleet/${id}`));
      this.vehicle.set(res);
    } catch {
      this.error.set('Veículo não encontrado.');
    } finally {
      this.loading.set(false);
    }
  }
}

