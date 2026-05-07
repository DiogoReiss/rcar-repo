import { ChangeDetectionStrategy, Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MessageService, MenuItem } from 'primeng/api';
import { ApiService } from '@core/services/api.service';
import { firstValueFrom } from 'rxjs';
import { Product, PaginatedResponse, StockMovementType } from '@shared/models/entities.model';
import PageHeaderComponent from '@shared/components/page-header/page-header';
import EntityDialogComponent from '@shared/components/entity-dialog/entity-dialog';
import AppButtonComponent from '@shared/components/app-button/app-button';
import FormFieldComponent from '@shared/components/form-field/form-field';
import RowMenuComponent from '@shared/components/row-menu/row-menu';

@Component({
  selector: 'lync-produtos-list',
  imports: [FormsModule, RouterLink, PageHeaderComponent, EntityDialogComponent, AppButtonComponent, FormFieldComponent, RowMenuComponent],
  templateUrl: './produtos-list.html',
  styleUrl: './produtos-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ProdutosListComponent implements OnInit {
  private readonly api   = inject(ApiService);
  private readonly toast = inject(MessageService);

  readonly products = signal<Product[]>([]);
  readonly loading  = signal(false);
  readonly saving   = signal(false);

  // ─── Product create/edit dialog ──────────────────────────────────
  readonly dialogVisible = signal(false);
  readonly editTarget    = signal<Product | null>(null);

  // Product form fields
  readonly fNome            = signal('');
  readonly fDescricao       = signal('');
  readonly fUnidade         = signal('');
  readonly fQuantidadeAtual = signal(0);
  readonly fEstoqueMinimo   = signal(0);
  readonly fCustoUnitario   = signal<number | ''>('');

  readonly lowStockCount = computed(() => this.products().filter(p => p.quantidadeAtual <= p.estoqueMinimo).length);
  readonly isEdit        = computed(() => !!this.editTarget());
  readonly dialogTitle   = computed(() => this.isEdit() ? 'Editar Produto' : 'Novo Produto');

  // ─── Movimentação dialog ─────────────────────────────────────────
  readonly movDialogVisible = signal(false);
  readonly movSaving        = signal(false);
  readonly movProduct       = signal<Product | null>(null);
  readonly movTipo          = signal<StockMovementType>('ENTRADA');
  readonly movQuantidade     = signal<number>(1);
  readonly movMotivo        = signal('');

  readonly movDialogTitle = computed(() => {
    const p = this.movProduct();
    return p ? `Movimentação — ${p.nome}` : 'Nova Movimentação';
  });

  readonly movTipos: { label: string; value: StockMovementType }[] = [
    { label: 'Entrada',  value: 'ENTRADA' },
    { label: 'Saída',    value: 'SAIDA'   },
    { label: 'Ajuste',   value: 'AJUSTE'  },
  ];

  /** Tracks the selected product id when no product is pre-filled (header button path). */
  readonly movSelectedProductId = computed(() => this.movProduct()?.id ?? '');

  onMovProductSelect(id: string) {
    const found = this.products().find(p => p.id === id) ?? null;
    this.movProduct.set(found);
  }

  ngOnInit() { this.load(); }

  async load() {
    this.loading.set(true);
    try {
      const res = await firstValueFrom(this.api.get<PaginatedResponse<Product>>('/inventory/products'));
      this.products.set(res.data);
    } finally { this.loading.set(false); }
  }

  // ─── Product dialog ───────────────────────────────────────────────
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
      this.toast.add({ severity: 'success', summary: this.isEdit() ? 'Produto atualizado' : 'Produto criado', life: 3000 });
    } finally { this.saving.set(false); }
  }

  // ─── Movimentação dialog ──────────────────────────────────────────
  openMovimentacao(p?: Product) {
    this.movProduct.set(p ?? null);
    this.movTipo.set('ENTRADA');
    this.movQuantidade.set(1);
    this.movMotivo.set('');
    this.movDialogVisible.set(true);
  }

  closeMovDialog() { this.movDialogVisible.set(false); }

  async onMovSave() {
    const p = this.movProduct();
    if (!p || !this.movQuantidade()) return;
    this.movSaving.set(true);
    try {
      await firstValueFrom(this.api.post('/inventory/movements', {
        productId: p.id,
        tipo: this.movTipo(),
        quantidade: this.movQuantidade(),
        motivo: this.movMotivo() || undefined,
      }));
      this.closeMovDialog();
      await this.load();
      this.toast.add({ severity: 'success', summary: 'Movimentação registrada', life: 3000 });
    } finally { this.movSaving.set(false); }
  }

  // ─── Helpers ──────────────────────────────────────────────────────
  isLow(p: Product) { return p.quantidadeAtual <= p.estoqueMinimo; }

  getRowMenuItems(p: Product): MenuItem[] {
    return [
      { label: 'Editar',        icon: 'pi pi-pencil',  command: () => this.openEdit(p) },
      { label: 'Movimentação',  icon: 'pi pi-history', command: () => this.openMovimentacao(p) },
    ];
  }
}
