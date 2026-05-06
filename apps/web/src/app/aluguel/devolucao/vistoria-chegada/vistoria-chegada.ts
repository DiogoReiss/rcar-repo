import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '@core/services/api.service';
import { firstValueFrom } from 'rxjs';
import { RentalContract } from '@shared/models/entities.model';
import PageHeaderComponent from '@shared/components/page-header/page-header';

@Component({
  selector: 'lync-vistoria-chegada',
  imports: [FormsModule, RouterLink, PageHeaderComponent],
  templateUrl: './vistoria-chegada.html',
  styleUrl: './vistoria-chegada.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class VistoriaChegadaComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly contract = signal<RentalContract | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal(false);

  readonly kmDevolucao = signal(0);
  readonly combustivelChegada = signal('CHEIO');
  readonly obs = signal('');

  // Checklist items
  readonly checklistItems = ['Lataria', 'Para-choque', 'Retrovisores', 'Vidros', 'Pneus', 'Interior', 'Documentos'];
  readonly checklist = signal<Record<string, boolean>>({});

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    const initial: Record<string, boolean> = {};
    this.checklistItems.forEach(i => initial[i] = true);
    this.checklist.set(initial);
    this.loadContract(id);
  }

  async loadContract(id: string) {
    try {
      const res = await firstValueFrom(this.api.get<RentalContract>(`/rental/contracts/${id}`));
      this.contract.set(res);
      // Q8: Fix wrong cast — kmAtual is on vehicle, default 0 if not available
      this.kmDevolucao.set(res.vehicle?.kmAtual ?? 0);
    } finally { this.loading.set(false); }
  }

  toggleItem(item: string) {
    this.checklist.update(c => ({ ...c, [item]: !c[item] }));
  }

  async onSubmit() {
    this.saving.set(true); this.error.set(null);
    try {
      await firstValueFrom(this.api.patch(`/rental/contracts/${this.contract()!.id}/close`, {
        kmDevolucao: this.kmDevolucao(),
        combustivelChegada: this.combustivelChegada(),
        checklist: this.checklist(),
        observacoes: this.obs() || undefined,
      }));
      this.success.set(true);
      setTimeout(() => this.router.navigate(['/aluguel/contratos']), 1500);
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'Erro ao registrar devolução.');
    } finally { this.saving.set(false); }
  }

  formatDate(d: string) { return new Date(d).toLocaleDateString('pt-BR'); }
  formatPrice(v: number) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v); }
}
