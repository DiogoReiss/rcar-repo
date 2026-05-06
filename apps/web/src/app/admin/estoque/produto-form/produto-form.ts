import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '@core/services/api.service';
import { firstValueFrom } from 'rxjs';
import { Product } from '@shared/models/entities.model';
import PageHeaderComponent from '@shared/components/page-header/page-header';

@Component({
  selector: 'lync-produto-form',
  imports: [FormsModule, RouterLink, PageHeaderComponent],
  templateUrl: './produto-form.html',
  styleUrl: './produto-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ProdutoFormComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly isEdit = signal(false);
  readonly editId = signal<string | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly nome = signal('');
  readonly descricao = signal('');
  readonly unidade = signal('');
  readonly quantidadeAtual = signal(0);
  readonly estoqueMinimo = signal(0);
  readonly custoUnitario = signal<number | undefined>(undefined);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true); this.editId.set(id);
      firstValueFrom(this.api.get<Product>(`/inventory/products/${id}`)).then(p => {
        this.nome.set(p.nome); this.descricao.set(p.descricao ?? '');
        this.unidade.set(p.unidade); this.quantidadeAtual.set(p.quantidadeAtual);
        this.estoqueMinimo.set(p.estoqueMinimo); this.custoUnitario.set(p.custoUnitario);
      });
    }
  }

  async onSubmit() {
    this.loading.set(true); this.error.set(null);
    const data = { nome: this.nome(), descricao: this.descricao() || undefined, unidade: this.unidade(), quantidadeAtual: this.quantidadeAtual(), estoqueMinimo: this.estoqueMinimo(), custoUnitario: this.custoUnitario() };
    try {
      this.isEdit()
        ? await firstValueFrom(this.api.patch(`/inventory/products/${this.editId()}`, data))
        : await firstValueFrom(this.api.post('/inventory/products', data));
      this.router.navigate(['/admin/estoque']);
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'Erro ao salvar produto.');
    } finally { this.loading.set(false); }
  }
}
