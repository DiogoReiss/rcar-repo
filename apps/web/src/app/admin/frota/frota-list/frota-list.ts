import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MenuItem, MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { FrotaService } from '../frota.service';
import { ApiService } from '@core/services/api.service';
import { Vehicle } from '@shared/models/entities.model';
import PageHeaderComponent from '@shared/components/page-header/page-header';
import EntityDialogComponent from '@shared/components/entity-dialog/entity-dialog';
import AppButtonComponent from '@shared/components/app-button/app-button';
import FormFieldComponent from '@shared/components/form-field/form-field';
import RowMenuComponent from '@shared/components/row-menu/row-menu';
import CurrencyBrlPipe from '@shared/pipes/currency-brl.pipe';
import DateBrPipe from '@shared/pipes/date-br.pipe';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

const STATUS_LABELS: Record<string, string> = {
  DISPONIVEL: 'Disponível', ALUGADO: 'Alugado',
  MANUTENCAO: 'Manutenção', INATIVO: 'Inativo',
};
const CAT_LABELS: Record<string, string> = {
  ECONOMICO: 'Econômico', INTERMEDIARIO: 'Intermediário',
  SUV: 'SUV', EXECUTIVO: 'Executivo', UTILITARIO: 'Utilitário',
};

interface VehicleDetail extends Vehicle {
  maintenances?: Array<{ id: string; descricao: string; custo: number; data: string }>;
  contracts?: Array<{
    id: string; status: string;
    dataRetirada: string; dataDevolucao: string;
    customer?: { nome: string };
  }>;
}

@Component({
  selector: 'lync-frota-list',
  imports: [FormsModule, PageHeaderComponent, EntityDialogComponent, AppButtonComponent, FormFieldComponent, RowMenuComponent, DialogModule, CurrencyBrlPipe, DateBrPipe],
  templateUrl: './frota-list.html',
  styleUrl: './frota-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class FrotaListComponent {
  private readonly frotaService = inject(FrotaService);
  private readonly api          = inject(ApiService);
  private readonly toast        = inject(MessageService);

  readonly veiculos = this.frotaService.veiculos;
  readonly loading  = this.frotaService.loading;
  readonly saving   = signal(false);

  // Edit/create dialog
  readonly dialogVisible = signal(false);
  readonly editTarget    = signal<Vehicle | null>(null);

  // Detail dialog
  readonly detailVehicle  = signal<VehicleDetail | null>(null);
  readonly detailLoading  = signal(false);

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

  readonly contractStatusClass: Record<string, string> = {
    RESERVADO: 'badge--warning', ATIVO: 'badge--success',
    ENCERRADO: 'badge--inactive', CANCELADO: 'badge--danger',
  };

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

  async openDetail(v: Vehicle) {
    this.detailLoading.set(true);
    this.detailVehicle.set(v as VehicleDetail); // show shell immediately
    try {
      const detail = await firstValueFrom(this.api.get<VehicleDetail>(`/fleet/${v.id}`));
      this.detailVehicle.set(detail);
    } finally {
      this.detailLoading.set(false);
    }
  }

  closeDetail() { this.detailVehicle.set(null); }

  getRowMenuItems(v: Vehicle): MenuItem[] {
    return [
      { label: 'Editar',        icon: 'pi pi-pencil', command: () => this.openEdit(v) },
      { label: 'Ver Detalhes',  icon: 'pi pi-eye',    command: () => this.openDetail(v) },
    ];
  }

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
        this.toast.add({ severity: 'success', summary: 'Veículo atualizado', detail: 'Alterações salvas.', life: 3000 });
      } else {
        await firstValueFrom(this.frotaService.create(data));
        this.toast.add({ severity: 'success', summary: 'Veículo cadastrado', detail: 'Veículo adicionado à frota.', life: 3000 });
      }
      this.closeDialog();
    } finally { this.saving.set(false); }
  }
}
