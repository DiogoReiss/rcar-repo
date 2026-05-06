import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ServicosService } from '../servicos.service';
import { WashService } from '@shared/models/entities.model';

@Component({
  selector: 'lync-servicos-list',
  imports: [RouterLink],
  templateUrl: './servicos-list.html',
  styleUrl: './servicos-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ServicosListComponent implements OnInit {
  private readonly servicosService = inject(ServicosService);

  readonly servicos = this.servicosService.servicos;
  readonly loading = this.servicosService.loading;
  readonly error = this.servicosService.error;
  readonly toggling = signal<string | null>(null);

  ngOnInit() { this.servicosService.load(true); }

  formatPrice(val: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  }

  async onToggle(s: WashService) {
    this.toggling.set(s.id);
    try {
      await this.servicosService.update(s.id, { ativo: !s.ativo });
    } finally {
      this.toggling.set(null);
    }
  }
}
