import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FrotaService } from '../frota.service';

const STATUS_LABELS: Record<string, string> = {
  DISPONIVEL: 'Disponível',
  ALUGADO: 'Alugado',
  MANUTENCAO: 'Manutenção',
  INATIVO: 'Inativo',
};
const CAT_LABELS: Record<string, string> = {
  ECONOMICO: 'Econômico',
  INTERMEDIARIO: 'Intermediário',
  SUV: 'SUV',
  EXECUTIVO: 'Executivo',
  UTILITARIO: 'Utilitário',
};

@Component({
  selector: 'lync-frota-list',
  imports: [RouterLink],
  templateUrl: './frota-list.html',
  styleUrl: './frota-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class FrotaListComponent implements OnInit {
  private readonly frotaService = inject(FrotaService);

  readonly veiculos = this.frotaService.veiculos;
  readonly loading = this.frotaService.loading;
  readonly error = this.frotaService.error;

  readonly statusLabel = (s: string) => STATUS_LABELS[s] ?? s;
  readonly catLabel = (s: string) => CAT_LABELS[s] ?? s;
  readonly statusClass = (s: string) => `badge--${s}`;

  ngOnInit() {
    this.frotaService.load();
  }
}
