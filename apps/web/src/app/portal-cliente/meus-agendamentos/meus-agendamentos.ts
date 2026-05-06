import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ApiService } from '@core/services/api.service';
import { WashSchedule, WashService as WashSvc } from '@shared/models/entities.model';
import PageHeaderComponent from '@shared/components/page-header/page-header';
import AppButtonComponent from '@shared/components/app-button/app-button';
import EntityDialogComponent from '@shared/components/entity-dialog/entity-dialog';
import FormFieldComponent from '@shared/components/form-field/form-field';
import CurrencyBrlPipe from '@shared/pipes/currency-brl.pipe';

@Component({
  selector: 'lync-meus-agendamentos',
  imports: [FormsModule, PageHeaderComponent, AppButtonComponent, EntityDialogComponent, FormFieldComponent, CurrencyBrlPipe],
  templateUrl: './meus-agendamentos.html',
  styleUrl: './meus-agendamentos.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class MeusAgendamentosComponent {
  private readonly api   = inject(ApiService);
  private readonly toast = inject(MessageService);

  readonly schedules = signal<WashSchedule[]>([]);
  readonly services  = signal<WashSvc[]>([]);
  readonly loading   = signal(true);

  // Booking dialog
  readonly dialogVisible = signal(false);
  readonly saving        = signal(false);
  readonly fServiceId    = signal('');
  readonly fDataHora     = signal(`${new Date().toISOString().slice(0, 10)}T09:00`);

  readonly upcoming = computed(() => this.schedules().filter(s => s.status === 'AGENDADO' || s.status === 'EM_ATENDIMENTO'));
  readonly past     = computed(() => this.schedules().filter(s => s.status === 'CONCLUIDO' || s.status === 'CANCELADO'));

  readonly statusLabel: Record<string, string> = {
    AGENDADO: 'Agendado', EM_ATENDIMENTO: 'Em Atendimento', CONCLUIDO: 'Concluído', CANCELADO: 'Cancelado',
  };
  readonly statusClass: Record<string, string> = {
    AGENDADO: 'badge--warning', EM_ATENDIMENTO: 'badge--operador', CONCLUIDO: 'badge--success', CANCELADO: 'badge--inactive',
  };

  constructor() {
    this.api.get<{ data: WashSvc[] }>('/wash/services').pipe(takeUntilDestroyed()).subscribe({
      next: (r) => { this.services.set(r.data); if (r.data.length) this.fServiceId.set(r.data[0].id); },
    });
    this.load();
  }

  private load() {
    this.loading.set(true);
    this.api.get<WashSchedule[]>('/portal/my-schedules').pipe(takeUntilDestroyed()).subscribe({
      next: (s) => { this.schedules.set(s); this.loading.set(false); },
      error: ()  => this.loading.set(false),
    });
  }

  openBook() {
    this.fDataHora.set(`${new Date().toISOString().slice(0, 10)}T09:00`);
    if (this.services().length) this.fServiceId.set(this.services()[0].id);
    this.dialogVisible.set(true);
  }

  async onSave() {
    this.saving.set(true);
    try {
      await firstValueFrom(this.api.post('/portal/my-schedules', {
        serviceId: this.fServiceId(),
        dataHora:  new Date(this.fDataHora()).toISOString(),
      }));
      this.dialogVisible.set(false);
      this.toast.add({ severity: 'success', summary: 'Agendamento confirmado!', life: 3000 });
      this.load();
    } finally {
      this.saving.set(false);
    }
  }

  formatDateTime(dt: string): string {
    return new Date(dt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
}
