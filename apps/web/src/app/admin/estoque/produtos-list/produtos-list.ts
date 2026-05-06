import { ChangeDetectionStrategy, Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '@core/services/api.service';
import { firstValueFrom } from 'rxjs';
import { Product } from '@shared/models/entities.model';

@Component({
  selector: 'lync-produtos-list',
  imports: [RouterLink],
  templateUrl: './produtos-list.html',
  styleUrl: './produtos-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ProdutosListComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly products = signal<Product[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly lowStockCount = computed(() => this.products().filter(p => p.quantidadeAtual <= p.estoqueMinimo).length);

  ngOnInit() { this.load(); }

  async load() {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(this.api.get<Product[]>('/inventory/products'));
      this.products.set(res);
    } catch { this.error.set('Erro ao carregar produtos.'); }
    finally { this.loading.set(false); }
  }

  formatQty(val: number, unit: string) { return `${val} ${unit}`; }
  isLow(p: Product) { return p.quantidadeAtual <= p.estoqueMinimo; }
}
