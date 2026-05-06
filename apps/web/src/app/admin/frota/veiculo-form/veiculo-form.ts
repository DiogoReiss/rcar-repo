import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FrotaService } from '../frota.service';

@Component({
  selector: 'lync-veiculo-form',
  imports: [FormsModule, RouterLink],
  templateUrl: './veiculo-form.html',
  styleUrl: './veiculo-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class VeiculoFormComponent implements OnInit {
  private readonly frotaService = inject(FrotaService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly isEdit = signal(false);
  readonly editId = signal<string | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly placa = signal('');
  readonly modelo = signal('');
  readonly ano = signal(new Date().getFullYear());
  readonly cor = signal('');
  readonly categoria = signal<string>('ECONOMICO');
  readonly status = signal<string>('DISPONIVEL');
  readonly kmAtual = signal(0);

  readonly categorias = ['ECONOMICO', 'INTERMEDIARIO', 'SUV', 'EXECUTIVO', 'UTILITARIO'];
  readonly statuses = ['DISPONIVEL', 'ALUGADO', 'MANUTENCAO', 'INATIVO'];

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.editId.set(id);
      const v = this.frotaService.veiculos().find(x => x.id === id);
      if (v) {
        this.placa.set(v.placa); this.modelo.set(v.modelo); this.ano.set(v.ano);
        this.cor.set(v.cor); this.categoria.set(v.categoria); this.status.set(v.status);
        this.kmAtual.set(v.kmAtual);
      }
    }
  }

  async onSubmit() {
    this.loading.set(true);
    this.error.set(null);
    const data = { placa: this.placa(), modelo: this.modelo(), ano: this.ano(), cor: this.cor(), categoria: this.categoria() as any, status: this.status() as any, kmAtual: this.kmAtual(), fotos: [] };
    try {
      this.isEdit() ? await this.frotaService.update(this.editId()!, data) : await this.frotaService.create(data);
      this.router.navigate(['/admin/frota']);
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'Erro ao salvar veículo.');
    } finally {
      this.loading.set(false);
    }
  }
}

