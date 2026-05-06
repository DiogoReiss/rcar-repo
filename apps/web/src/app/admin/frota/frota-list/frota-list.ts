import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { FrotaService } from '../frota.service';
import { Vehicle } from '@shared/models/entities.model';
import PageHeaderComponent from '@shared/components/page-header/page-header';
import EntityDialogComponent from '@shared/components/entity-dialog/entity-dialog';
import AppButtonComponent from '@shared/components/app-button/app-button';
import FormFieldComponent from '@shared/components/form-field/form-field';

const STATUS_LABELS: Record<string, string> = {
  DISPONIVEL: 'Disponível', ALUGADO: 'Alugado',
  MANUTENCAO: 'Manutenção', INATIVO: 'Inativo',
};
const CAT_LABELS: Record<string, string> = {
  ECONOMICO: 'Econômico', INTERMEDIARIO: 'Intermediário',
  SUV: 'SUV', EXECUTIVO: 'Executivo', UTILITARIO: 'Utilitário',
};

@Component({
  selector: 'lync-frota-list',
  imports: [FormsModule, PageHeaderComponent, EntityDialogComponent, AppButtonComponent, FormFieldComponent],
  templateUrl: './frota-list.html',
  styleUrl: './frota-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class FrotaListComponent {
  private readonly frotaService = inject(FrotaService);

  readonly veiculos = this.frotaService.veiculos;
  readonly loading  = this.frotaService.loading;
  readonly saving   = signal(false);

  // Dialog
  readonly dialogVisible = signal(false);
  readonly editTarget    = signal<Vehicle | null>(null);

  // Form fields
  readonly fPlaca     = signal('');
  readonly fModelo    = signal('');
  readonly fAno       = signal(new Date().getFullYear());
  readonly fCor       = signal('');
  readonly fCategoria = signal('ECONOMICO');
  readonly fStatus    = signal('DISPONIVEL');
  readonly fKm        = signal(0);

  readonly categorias = ['ECONOMICO', 'INTERMEDIARIO', 'SUV', 'EXECUTIVO', 'UTILITARIO'];
  readonly statuses   = ['DISPONIVEL', 'ALUGADO', 'MANUTENCAO', 'INATIVO'];

  readonly isEdit      = computed(() => !!this.editTarget());
  readonly dialogTitle = computed(() => this.isEdit() ? 'Editar Veículo' : 'Novo Veículo');

  readonly statusLabel = (s: string) => STATUS_LABELS[s] ?? s;
  readonly catLabel    = (s: string) => CAT_LABELS[s] ?? s;
  readonly statusClass = (s: string) => `badge--${s}`;

  constructor() {
    this.frotaService.load().pipe(takeUntilDestroyed()).subscribe();
  }

  openNew() {
    this.editTarget.set(null);
    this.fPlaca.set(''); this.fModelo.set('');
    this.fAno.set(new Date().getFullYear()); this.fCor.set('');
    this.fCategoria.set('ECONOMICO'); this.fStatus.set('DISPONIVEL');
    this.fKm.set(0); this.dialogVisible.set(true);
  }

  openEdit(v: Vehicle) {
    this.editTarget.set(v);
    this.fPlaca.set(v.placa); this.fModelo.set(v.modelo);
    this.fAno.set(v.ano); this.fCor.set(v.cor);
    this.fCategoria.set(v.categoria); this.fStatus.set(v.status);
    this.fKm.set(v.kmAtual); this.dialogVisible.set(true);
  }

  closeDialog() { this.dialogVisible.set(false); }

  async onDialogSave() {
    this.saving.set(true);
    const data = {
      placa: this.fPlaca(), modelo: this.fModelo(), ano: this.fAno(),
      cor: this.fCor(), categoria: this.fCategoria() as Vehicle['categoria'],
      status: this.fStatus() as Vehicle['status'], kmAtual: this.fKm(), fotos: [],
    };
    try {
      if (this.isEdit()) {
        await firstValueFrom(this.frotaService.update(this.editTarget()!.id, data));
      } else {
        await firstValueFrom(this.frotaService.create(data));
      }
      this.closeDialog();
    } finally { this.saving.set(false); }
  }
}
