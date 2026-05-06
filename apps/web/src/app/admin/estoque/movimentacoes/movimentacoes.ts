import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ApiService } from '@core/services/api.service';
import { firstValueFrom } from 'rxjs';
import { StockMovement } from '@shared/models/entities.model';

@Component({
  selector: 'lync-movimentacoes',
  imports: [FormsModule, RouterLink],
  templateUrl: './movimentacoes.html',
  styleUrl: './movimentacoes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class MovimentacoesComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);

  readonly movements = signal<StockMovement[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  // New movement form
  readonly showForm = signal(false);
  readonly formLoading = signal(false);
  readonly formError = signal<string | null>(null);
  readonly productId = signal('');
  readonly tipo = signal<'ENTRADA' | 'SAIDA' | 'AJUSTE'>('ENTRADA');
  readonly quantidade = signal(0);
  readonly motivo = signal('');

  ngOnInit() {
    const pid = this.route.snapshot.queryParamMap.get('productId');
    if (pid) this.productId.set(pid);
    this.load();
  }

  async load() {
    this.loading.set(true); this.error.set(null);
    try {
      const pid = this.productId();
      const path = pid ? `/inventory/movements?productId=${pid}` : '/inventory/movements';
      const res = await firstValueFrom(this.api.get<StockMovement[]>(path));
      this.movements.set(res);
    } catch { this.error.set('Erro ao carregar movimentações.'); }
    finally { this.loading.set(false); }
  }

  async onSubmitMovement() {
    if (!this.productId() || !this.quantidade()) return;
    this.formLoading.set(true); this.formError.set(null);
    try {
      await firstValueFrom(this.api.post('/inventory/movements', { productId: this.productId(), tipo: this.tipo(), quantidade: this.quantidade(), motivo: this.motivo() || undefined }));
      this.showForm.set(false); this.quantidade.set(0); this.motivo.set('');
      await this.load();
    } catch (e: any) {
      this.formError.set(e?.error?.message ?? 'Erro ao registrar movimentação.');
    } finally { this.formLoading.set(false); }
  }

  tipoLabel(t: string) { return { ENTRADA: 'Entrada', SAIDA: 'Saída', AJUSTE: 'Ajuste' }[t] ?? t; }
  tipoClass(t: string) { return { ENTRADA: 'badge--success', SAIDA: 'badge--danger', AJUSTE: 'badge--warning' }[t] ?? ''; }
  formatDate(d: string) { return new Date(d).toLocaleString('pt-BR'); }
}
