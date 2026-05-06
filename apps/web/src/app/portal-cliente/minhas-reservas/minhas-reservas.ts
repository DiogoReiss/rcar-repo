import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ApiService } from '@core/services/api.service';
import { RentalContract, Vehicle, PaginatedResponse } from '@shared/models/entities.model';
import PageHeaderComponent from '@shared/components/page-header/page-header';
import AppButtonComponent from '@shared/components/app-button/app-button';
import EntityDialogComponent from '@shared/components/entity-dialog/entity-dialog';
import FormFieldComponent from '@shared/components/form-field/form-field';
import CurrencyBrlPipe from '@shared/pipes/currency-brl.pipe';

@Component({
  selector: 'lync-minhas-reservas',
  imports: [FormsModule, PageHeaderComponent, AppButtonComponent, EntityDialogComponent, FormFieldComponent, CurrencyBrlPipe],
  templateUrl: './minhas-reservas.html',
  styleUrl: './minhas-reservas.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class MinhasReservasComponent {
  private readonly api        = inject(ApiService);
  private readonly toast      = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  readonly contracts      = signal<RentalContract[]>([]);
  readonly availVehicles  = signal<Vehicle[]>([]);
  readonly loading        = signal(true);

  // Nova Reserva dialog
  readonly dialogVisible  = signal(false);
  readonly saving         = signal(false);
  readonly fVehicleId     = signal('');
  readonly fModalidade    = signal('DIARIA');
  readonly fDataRetirada  = signal('');
  readonly fDataDevolucao = signal('');
  readonly fSeguro        = signal(false);

  readonly modalidades = [
    { value: 'DIARIA',  label: 'Diária' },
    { value: 'SEMANAL', label: 'Semanal' },
    { value: 'MENSAL',  label: 'Mensal' },
  ];

  readonly statusLabel: Record<string, string> = {
    RESERVADO: 'Reservado', ATIVO: 'Ativo', ENCERRADO: 'Encerrado', CANCELADO: 'Cancelado',
  };
  readonly statusClass: Record<string, string> = {
    RESERVADO: 'badge--warning', ATIVO: 'badge--operador', ENCERRADO: 'badge--inactive', CANCELADO: 'badge--danger',
  };

  readonly categoriaLabel: Record<string, string> = {
    ECONOMICO: 'Econômico', INTERMEDIARIO: 'Intermediário', SUV: 'SUV', EXECUTIVO: 'Executivo', UTILITARIO: 'Utilitário',
  };

  constructor() {
    this.load();
    this.api.get<PaginatedResponse<Vehicle>>('/portal/available-vehicles')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (r) => {
        this.availVehicles.set(r.data);
        if (r.data.length) this.fVehicleId.set(r.data[0].id);
      }});
  }

  private load() {
    this.loading.set(true);
    this.api.get<PaginatedResponse<RentalContract>>('/portal/my-contracts')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (r) => { this.contracts.set(r.data); this.loading.set(false); },
        error: ()  => this.loading.set(false),
      });
  }

  openNew() {
    const today = new Date().toISOString().slice(0, 10);
    const plus3 = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
    this.fDataRetirada.set(today);
    this.fDataDevolucao.set(plus3);
    this.fModalidade.set('DIARIA');
    this.fSeguro.set(false);
    if (this.availVehicles().length) this.fVehicleId.set(this.availVehicles()[0].id);
    this.dialogVisible.set(true);
  }

  async onSave() {
    this.saving.set(true);
    try {
      await firstValueFrom(this.api.post('/portal/my-contracts', {
        vehicleId:     this.fVehicleId(),
        dataRetirada:  new Date(this.fDataRetirada()).toISOString(),
        dataDevolucao: new Date(this.fDataDevolucao()).toISOString(),
        modalidade:    this.fModalidade(),
        seguro:        this.fSeguro(),
      }));
      this.dialogVisible.set(false);
      this.toast.add({ severity: 'success', summary: 'Reserva solicitada!', detail: 'Entraremos em contato para confirmar.', life: 4000 });
      this.load();
    } finally {
      this.saving.set(false);
    }
  }

  selectedVehicle() {
    return this.availVehicles().find(v => v.id === this.fVehicleId());
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}
