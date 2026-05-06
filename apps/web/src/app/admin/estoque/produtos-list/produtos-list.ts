import { ChangeDetectionStrategy, Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '@core/services/api.service';
import { firstValueFrom } from 'rxjs';
import { Product, PaginatedResponse } from '@shared/models/entities.model';
import PageHeaderComponent from '@shared/components/page-header/page-header';
import EntityDialogComponent from '@shared/components/entity-dialog/entity-dialog';
import AppButtonComponent from '@shared/components/app-button/app-button';
import FormFieldComponent from '@shared/components/form-field/form-field';

@Component({
  selector: 'lync-produtos-list',
  imports: [FormsModule, RouterLink, PageHeaderComponent, EntityDialogComponent, AppButtonComponent, FormFieldComponent],
  templateUrl: './produtos-list.html',
  styleUrl: './produtos-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ProdutosListComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly products = signal<Product[]>([]);
  readonly loading  = signal(false);
  readonly saving   = signal(false);

  // Dialog state
  readonly dialogVisible = signal(false);
  readonly editTarget    = signal<Product | null>(null);

  // Form fields
  readonly fNome            = signal('');
  readonly fDescricao       = signal('');
  readonly fUnidade         = signal('');
  readonly fQuantidadeAtual = signal(0);
  readonly fEstoqueMinimo   = signal(0);
  readonly fCustoUnitario   = signal<number | ''>('');

  readonly lowStockCount = computed(() => this.products().filter(p => p.quantidadeAtual <= p.estoqueMinimo).length);
  readonly isEdit        = computed(() => !!this.editTarget());
  readonly dialogTitle   = computed(() => this.isEdit() ? 'Editar Produto' : 'Novo Produto');

  ngOnInit() { this.load(); }

  async load() {
    this.loading.set(true);
    try {
      const res = await firstValueFrom(this.api.get<PaginatedResponse<Product>>('/inventory/products'));
      this.products.set(res.data);
    } finally { this.loading.set(false); }
  }

  openNew() {
    this.editTarget.set(null);
    this.fNome.set(''); this.fDescricao.set(''); this.fUnidade.set('');
    this.fQuantidadeAtual.set(0); this.fEstoqueMinimo.set(0); this.fCustoUnitario.set('');
    this.dialogVisible.set(true);
  }

  openEdit(p: Product) {
    this.editTarget.set(p);
    this.fNome.set(p.nome); this.fDescricao.set(p.descricao ?? '');
    this.fUnidade.set(p.unidade); this.fQuantidadeAtual.set(p.quantidadeAtual);
    this.fEstoqueMinimo.set(p.estoqueMinimo);
    this.fCustoUnitario.set(p.custoUnitario ?? '');
    this.dialogVisible.set(true);
  }

  closeDialog() { this.dialogVisible.set(false); }

  async onDialogSave() {
    this.saving.set(true);
    const data = {
      nome: this.fNome(), descricao: this.fDescricao() || undefined,
      unidade: this.fUnidade(), quantidadeAtual: this.fQuantidadeAtual(),
      estoqueMinimo: this.fEstoqueMinimo(),
      custoUnitario: this.fCustoUnitario() !== '' ? Number(this.fCustoUnitario()) : undefined,
    };
    try {
      if (this.isEdit()) {
        await firstValueFrom(this.api.patch(`/inventory/products/${this.editTarget()!.id}`, data));
      } else {
        await firstValueFrom(this.api.post('/inventory/products', data));
      }
      this.closeDialog();
      await this.load();
    } finally { this.saving.set(false); }
  }

  isLow(p: Product) { return p.quantidadeAtual <= p.estoqueMinimo; }
}
