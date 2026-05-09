import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MessageService } from 'primeng/api';
import { RowMenuItem } from '@shared/components/row-menu/row-menu';
import { DialogModule } from 'primeng/dialog';
import { FrotaService } from '../frota.service';
import { ApiService } from '@core/services/api.service';
import { StorageService } from '@core/services/storage.service';
import { Vehicle, VehicleMaintenance } from '@shared/models/entities.model';
import PageHeaderComponent from '@shared/components/page-header/page-header';
import EntityDialogComponent from '@shared/components/entity-dialog/entity-dialog';
import AppButtonComponent from '@shared/components/app-button/app-button';
import FormFieldComponent from '@shared/components/form-field/form-field';
import FileUploadComponent from '@shared/components/file-upload/file-upload';
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
  maintenances?: VehicleMaintenance[];
  contracts?: Array<{
    id: string; status: string;
    dataRetirada: string; dataDevolucao: string;
    customer?: { nome: string };
  }>;
}

@Component({
  selector: 'lync-frota-list',
  imports: [FormsModule, PageHeaderComponent, EntityDialogComponent, AppButtonComponent, FormFieldComponent, FileUploadComponent, RowMenuComponent, DialogModule, CurrencyBrlPipe, DateBrPipe],
  templateUrl: './frota-list.html',
  styleUrl: './frota-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class FrotaListComponent {
  private readonly frotaService = inject(FrotaService);
  private readonly api          = inject(ApiService);
  private readonly storage      = inject(StorageService);
  private readonly toast        = inject(MessageService);

  readonly veiculos = this.frotaService.veiculos;
  readonly loading  = this.frotaService.loading;
  readonly saving   = signal(false);

  // ── Edit/create dialog ─────────────────────────────────────────────────────
  readonly dialogVisible = signal(false);
  readonly editTarget    = signal<Vehicle | null>(null);

  // ── Detail dialog ──────────────────────────────────────────────────────────
  readonly detailVehicle  = signal<VehicleDetail | null>(null);
  readonly detailLoading  = signal(false);

  // ── Maintenance dialog ─────────────────────────────────────────────────────
  readonly maintDialogVisible = signal(false);
  readonly maintTarget        = signal<Vehicle | null>(null);
  readonly maintSaving        = signal(false);
  readonly fMaintDesc         = signal('');
  readonly fMaintCusto        = signal(0);
  readonly fMaintData         = signal(new Date().toISOString().slice(0, 10));
  readonly fMaintSetStatus    = signal(false);

  // ── Vehicle form fields ────────────────────────────────────────────────────
  readonly fPlaca     = signal('');
  readonly fModelo    = signal('');
  readonly fAno       = signal(new Date().getFullYear());
  readonly fCor       = signal('');
  readonly fCategoria = signal('ECONOMICO');
  readonly fStatus    = signal('DISPONIVEL');
  readonly fKm        = signal(0);
  readonly fFoto      = signal<string | null>(null);
  readonly openingObjectKey = signal<string | null>(null);

  readonly categorias = ['ECONOMICO', 'INTERMEDIARIO', 'SUV', 'EXECUTIVO', 'UTILITARIO'];
  readonly statuses   = ['DISPONIVEL', 'ALUGADO', 'MANUTENCAO', 'INATIVO'];

  readonly isEdit      = computed(() => !!this.editTarget());
  readonly dialogTitle = computed(() => this.isEdit() ? 'Editar Veículo' : 'Novo Veículo');

  readonly statusLabel = (s: string) => STATUS_LABELS[s] ?? s;
  readonly catLabel    = (s: string) => CAT_LABELS[s] ?? s;
  readonly statusClass = (s: string) => `badge--${s.toLowerCase()}`;

  readonly contractStatusClass: Record<string, string> = {
    RESERVADO: 'badge--warning', ATIVO: 'badge--success',
    ENCERRADO: 'badge--inactive', CANCELADO: 'badge--danger',
  };

  constructor() {
    this.frotaService.load().pipe(takeUntilDestroyed()).subscribe();
  }

  // ── CRUD dialog ────────────────────────────────────────────────────────────
  openNew() {
    this.editTarget.set(null);
    this.fPlaca.set(''); this.fModelo.set('');
    this.fAno.set(new Date().getFullYear()); this.fCor.set('');
    this.fCategoria.set('ECONOMICO'); this.fStatus.set('DISPONIVEL');
    this.fKm.set(0); this.fFoto.set(null); this.dialogVisible.set(true);
  }

  openEdit(v: Vehicle) {
    this.editTarget.set(v);
    this.fPlaca.set(v.placa); this.fModelo.set(v.modelo);
    this.fAno.set(v.ano); this.fCor.set(v.cor);
    this.fCategoria.set(v.categoria); this.fStatus.set(v.status);
    this.fKm.set(v.kmAtual); this.fFoto.set(v.fotos?.[0] ?? null); this.dialogVisible.set(true);
  }

  closeDialog() { this.dialogVisible.set(false); }

  // ── Detail dialog ──────────────────────────────────────────────────────────
  async openDetail(v: Vehicle) {
    this.detailLoading.set(true);
    this.detailVehicle.set(v as VehicleDetail);
    try {
      const detail = await firstValueFrom(this.api.get<VehicleDetail>(`/fleet/${v.id}`));
      this.detailVehicle.set(detail);
    } finally {
      this.detailLoading.set(false);
    }
  }

  closeDetail() { this.detailVehicle.set(null); }

  // ── Maintenance dialog ─────────────────────────────────────────────────────
  openMaintenance(v: Vehicle) {
    this.maintTarget.set(v);
    this.fMaintDesc.set('');
    this.fMaintCusto.set(0);
    this.fMaintData.set(new Date().toISOString().slice(0, 10));
    this.fMaintSetStatus.set(v.status !== 'MANUTENCAO');
    this.maintDialogVisible.set(true);
  }

  closeMaintDialog() { this.maintDialogVisible.set(false); }

  async onMaintenanceSave() {
    const v = this.maintTarget();
    if (!v) return;
    this.maintSaving.set(true);
    try {
      await firstValueFrom(this.api.post(`/fleet/${v.id}/maintenances`, {
        descricao:    this.fMaintDesc(),
        custo:        this.fMaintCusto(),
        data:         `${this.fMaintData()}T12:00:00Z`,
        setMantencao: this.fMaintSetStatus(),
      }));
      this.toast.add({ severity: 'success', summary: 'Manutenção registrada', detail: `Manutenção para ${v.placa} salva.`, life: 3000 });
      if (this.fMaintSetStatus()) {
        await firstValueFrom(this.frotaService.load());
      }
      this.maintDialogVisible.set(false);
    } catch {
      this.toast.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível salvar.', life: 4000 });
    } finally { this.maintSaving.set(false); }
  }

  async completeMaintenance(v: Vehicle) {
    try {
      await firstValueFrom(this.api.patch(`/fleet/${v.id}/complete-maintenance`, {}));
      this.toast.add({ severity: 'success', summary: 'Manutenção concluída', detail: `${v.placa} está disponível.`, life: 3000 });
      await firstValueFrom(this.frotaService.load());
    } catch {
      this.toast.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível concluir.', life: 4000 });
    }
  }

  // ── Row menu ───────────────────────────────────────────────────────────────
  getRowMenuItems(v: Vehicle): RowMenuItem[] {
    const items: RowMenuItem[] = [
      { label: 'Editar',               icon: 'pi pi-pencil', command: () => this.openEdit(v) },
      { label: 'Ver Detalhes',          icon: 'pi pi-eye',    command: () => this.openDetail(v) },
      { separator: true },
      { label: 'Registrar Manutenção', icon: 'pi pi-wrench', command: () => this.openMaintenance(v) },
    ];
    if (v.status === 'MANUTENCAO') {
      items.push({ label: 'Concluir Manutenção', icon: 'pi pi-check-circle', command: () => this.completeMaintenance(v) });
    }
    return items;
  }

  // ── Save vehicle ───────────────────────────────────────────────────────────
  async onDialogSave() {
    this.saving.set(true);
    const data = {
      placa: this.fPlaca(), modelo: this.fModelo(), ano: this.fAno(),
      cor: this.fCor(), categoria: this.fCategoria() as Vehicle['categoria'],
      status: this.fStatus() as Vehicle['status'], kmAtual: this.fKm(), fotos: this.fFoto() ? [this.fFoto()!] : [],
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

  async openStoredFile(objectKey: string, downloadName?: string) {
    this.openingObjectKey.set(objectKey);
    try {
      const url = await this.storage.getDownloadUrl(objectKey, downloadName);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      this.toast.add({
        severity: 'error',
        summary: 'Erro ao abrir arquivo',
        detail: 'Não foi possível gerar o link do arquivo.',
        life: 4000,
      });
    } finally {
      this.openingObjectKey.set(null);
    }
  }
}
