import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom, forkJoin } from 'rxjs';
import { MessageService } from 'primeng/api';
import { AgendamentoService } from '../agendamento.service';
import { PaymentMethod, WashSchedule } from '@shared/models/entities.model';
import PageHeaderComponent from '@shared/components/page-header/page-header';
import EntityDialogComponent from '@shared/components/entity-dialog/entity-dialog';
import ConfirmDialogComponent from '@shared/components/confirm-dialog/confirm-dialog';
import FormFieldComponent from '@shared/components/form-field/form-field';
import AppButtonComponent from '@shared/components/app-button/app-button';
import PaymentDialogComponent from '@shared/components/payment-dialog/payment-dialog';
import CurrencyBrlPipe from '@shared/pipes/currency-brl.pipe';

@Component({
  selector: 'lync-calendario',
  imports: [
    FormsModule,
    PageHeaderComponent,
    EntityDialogComponent,
    ConfirmDialogComponent,
    FormFieldComponent,
    AppButtonComponent,
    PaymentDialogComponent,
    CurrencyBrlPipe,
  ],
  templateUrl: './calendario.html',
  styleUrl: './calendario.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class CalendarioComponent {
  private readonly agendamentoService = inject(AgendamentoService);
  private readonly toast = inject(MessageService);

  readonly today        = new Date().toISOString().slice(0, 10);
  readonly selectedDate = signal(this.today);
  readonly schedules    = this.agendamentoService.schedules;
  readonly services     = this.agendamentoService.services;
  readonly loading      = this.agendamentoService.loading;

  // ─── View mode ────────────────────────────────────────────────────
  readonly viewMode     = signal<'day' | 'week'>('day');
  readonly weekLoading  = signal(false);
  readonly weekSchedules = signal<Record<string, WashSchedule[]>>({});

  readonly currentWeekDays = computed<string[]>(() => {
    const base = new Date(this.selectedDate() + 'T12:00:00');
    const dow = base.getDay(); // 0 = Sunday
    const offset = dow === 0 ? -6 : 1 - dow; // back to Monday
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + offset + i);
      return d.toISOString().slice(0, 10);
    });
  });

  // New / edit dialog
  readonly dialogVisible = signal(false);
  readonly saving        = signal(false);
  readonly fNome         = signal('');
  readonly fTelefone     = signal('');
  readonly fServiceId    = signal('');
  readonly fDataHora     = signal(`${new Date().toISOString().slice(0, 10)}T09:00`);
  readonly fObs          = signal('');

  // Cancel confirm
  readonly cancelTarget = signal<WashSchedule | null>(null);
  readonly cancelling   = signal(false);

  // Payment dialog
  readonly payingId    = signal<string | null>(null);
  readonly payLoading  = signal(false);

  readonly statusLabel: Record<string, string> = {
    AGENDADO: 'Agendado', EM_ATENDIMENTO: 'Em Atend.', CONCLUIDO: 'Concluído', CANCELADO: 'Cancelado',
  };
  readonly statusClass: Record<string, string> = {
    AGENDADO: 'badge--warning', EM_ATENDIMENTO: 'badge--operador',
    CONCLUIDO: 'badge--success', CANCELADO: 'badge--inactive',
  };

  readonly pendingCount = computed(() => this.schedules().filter(s => s.status === 'AGENDADO').length);
  readonly activeCount  = computed(() => this.schedules().filter(s => s.status === 'EM_ATENDIMENTO').length);
  readonly doneCount    = computed(() => this.schedules().filter(s => s.status === 'CONCLUIDO').length);

  constructor() {
    this.agendamentoService.loadServices().pipe(takeUntilDestroyed()).subscribe({
      next: (res) => { if (res.data.length) this.fServiceId.set(res.data[0].id); },
    });
    this.loadSchedules();
  }

  // ─── Day view ─────────────────────────────────────────────────────
  private loadSchedules() {
    this.agendamentoService.loadSchedules(this.selectedDate()).pipe(takeUntilDestroyed()).subscribe();
  }

  onDateChange(d: string) {
    this.selectedDate.set(d);
    this.agendamentoService.loadSchedules(d).pipe(takeUntilDestroyed()).subscribe();
  }

  // ─── Week / day toggle ────────────────────────────────────────────
  switchView(mode: 'day' | 'week') {
    this.viewMode.set(mode);
    if (mode === 'week') this.loadWeek();
    else this.loadSchedules();
  }

  private loadWeek() {
    const days = this.currentWeekDays();
    this.weekLoading.set(true);
    forkJoin(days.map(d => this.agendamentoService.fetchSchedules(d))).subscribe({
      next: (results) => {
        const map: Record<string, WashSchedule[]> = {};
        days.forEach((d, i) => { map[d] = results[i]; });
        this.weekSchedules.set(map);
        this.weekLoading.set(false);
      },
      error: () => this.weekLoading.set(false),
    });
  }

  switchToDay(date: string) {
    this.selectedDate.set(date);
    this.viewMode.set('day');
    this.agendamentoService.loadSchedules(date).pipe(takeUntilDestroyed()).subscribe();
  }

  // ─── Dialog & actions ─────────────────────────────────────────────
  openNew() {
    this.fNome.set(''); this.fTelefone.set(''); this.fObs.set('');
    this.fDataHora.set(`${this.selectedDate()}T09:00`);
    if (this.services().length) this.fServiceId.set(this.services()[0].id);
    this.dialogVisible.set(true);
  }

  async onDialogSave() {
    this.saving.set(true);
    try {
      await firstValueFrom(this.agendamentoService.create({
        nomeAvulso: this.fNome(),
        telefone:   this.fTelefone() || undefined,
        serviceId:  this.fServiceId(),
        dataHora:   new Date(this.fDataHora()).toISOString(),
        observacoes: this.fObs() || undefined,
      }));
      this.dialogVisible.set(false);
      this.toast.add({ severity: 'success', summary: 'Agendamento criado', life: 3000 });
      if (this.viewMode() === 'week') this.loadWeek();
      else await firstValueFrom(this.agendamentoService.loadSchedules(this.selectedDate()));
    } finally {
      this.saving.set(false);
    }
  }

  async updateStatus(id: string, status: string) {
    await firstValueFrom(this.agendamentoService.updateStatus(id, status));
    const label = status === 'EM_ATENDIMENTO' ? 'Atendimento iniciado' : 'Serviço concluído';
    this.toast.add({ severity: 'success', summary: label, life: 3000 });
    await firstValueFrom(this.agendamentoService.loadSchedules(this.selectedDate()));
  }

  confirmCancel(s: WashSchedule) { this.cancelTarget.set(s); }

  async onConfirmCancel() {
    const s = this.cancelTarget();
    if (!s) return;
    this.cancelTarget.set(null);
    this.cancelling.set(true);
    try {
      await firstValueFrom(this.agendamentoService.cancel(s.id));
      this.toast.add({ severity: 'info', summary: 'Agendamento cancelado', life: 3000 });
      if (this.viewMode() === 'week') this.loadWeek();
      else await firstValueFrom(this.agendamentoService.loadSchedules(this.selectedDate()));
    } finally {
      this.cancelling.set(false);
    }
  }

  async onPay(metodo: PaymentMethod) {
    const id = this.payingId();
    if (!id) return;
    this.payLoading.set(true);
    try {
      await firstValueFrom(this.agendamentoService.pay(id, metodo));
      this.payingId.set(null);
      this.toast.add({ severity: 'success', summary: 'Pagamento registrado', life: 3000 });
      await firstValueFrom(this.agendamentoService.loadSchedules(this.selectedDate()));
    } finally {
      this.payLoading.set(false);
    }
  }

  // ─── Formatters ───────────────────────────────────────────────────
  formatTime(dt: string): string {
    return new Date(dt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  formatWeekDay(date: string): string {
    return new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short' })
      .replace('.', '').toUpperCase();
  }

  formatDayShort(date: string): string {
    return new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }
}
