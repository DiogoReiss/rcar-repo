import {
  ChangeDetectionStrategy, Component, computed, effect,
  inject, signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom, forkJoin } from 'rxjs';
import { MessageService } from 'primeng/api';
import { AgendamentoService } from '../agendamento.service';
import {
  PaymentMethod, WashSchedule, AvailabilitySlot,
} from '@shared/models/entities.model';
import PageHeaderComponent from '@shared/components/page-header/page-header';
import EntityDialogComponent from '@shared/components/entity-dialog/entity-dialog';
import ConfirmDialogComponent from '@shared/components/confirm-dialog/confirm-dialog';
import FormFieldComponent from '@shared/components/form-field/form-field';
import AppButtonComponent from '@shared/components/app-button/app-button';
import PaymentDialogComponent from '@shared/components/payment-dialog/payment-dialog';
import CurrencyBrlPipe from '@shared/pipes/currency-brl.pipe';
import MiniCalendarComponent from '@shared/components/mini-calendar/mini-calendar';

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
    MiniCalendarComponent,
  ],
  templateUrl: './calendario.html',
  styleUrl: './calendario.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class CalendarioComponent {
  private readonly agendamentoService = inject(AgendamentoService);
  private readonly toast = inject(MessageService);

  readonly today         = new Date().toISOString().slice(0, 10);
  readonly selectedDate  = signal(this.today);
  readonly schedules     = this.agendamentoService.schedules;
  readonly services      = this.agendamentoService.services;
  readonly loading       = this.agendamentoService.loading;
  readonly monthSummary  = this.agendamentoService.monthSummary;

  // ─── View mode ────────────────────────────────────────────────────
  readonly viewMode      = signal<'day' | 'week'>('day');
  readonly weekLoading   = signal(false);
  readonly weekSchedules = signal<Record<string, WashSchedule[]>>({});

  readonly currentWeekDays = computed<string[]>(() => {
    const base = new Date(this.selectedDate() + 'T12:00:00');
    const dow = base.getDay();
    const offset = dow === 0 ? -6 : 1 - dow;
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + offset + i);
      return d.toISOString().slice(0, 10);
    });
  });

  // ─── New / edit dialog ────────────────────────────────────────────
  readonly dialogVisible = signal(false);
  readonly saving        = signal(false);
  readonly fNome         = signal('');
  readonly fTelefone     = signal('');
  readonly fServiceId    = signal('');
  readonly fDate         = signal(this.today);
  readonly fTime         = signal('09:00');
  readonly fObs          = signal('');
  readonly fDataHora     = computed(() => `${this.fDate()}T${this.fTime()}:00.000Z`);

  // Availability slots for the dialog
  readonly slots        = signal<AvailabilitySlot[]>([]);
  readonly slotsLoading = signal(false);

  // ─── Cancel confirm ────────────────────────────────────────────────
  readonly cancelTarget = signal<WashSchedule | null>(null);
  readonly cancelling   = signal(false);

  // ─── Payment dialog ────────────────────────────────────────────────
  readonly payingId   = signal<string | null>(null);
  readonly payLoading = signal(false);

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
    // Load services, then select first
    this.agendamentoService.loadServices().pipe(takeUntilDestroyed()).subscribe({
      next: (res) => { if (res.data.length) this.fServiceId.set(res.data[0].id); },
    });

    // Initial day + month load
    this.loadSchedules();
    this.loadMonthSummary();

    // Re-fetch availability when dialog date or service changes
    effect(() => {
      const date    = this.fDate();
      const service = this.fServiceId();
      if (this.dialogVisible() && date && service) {
        this.fetchSlots(date, service);
      }
    });
  }

  // ─── Month summary (for mini-calendar dots) ────────────────────────
  private currentViewMonth(): string {
    const d = new Date(this.selectedDate() + 'T12:00:00');
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  private loadMonthSummary(): void {
    this.agendamentoService.loadMonthSummary(this.currentViewMonth())
      .pipe(takeUntilDestroyed()).subscribe();
  }

  onMonthChanged(month: string): void {
    this.agendamentoService.loadMonthSummary(month).pipe(takeUntilDestroyed()).subscribe();
  }

  // ─── Day view ──────────────────────────────────────────────────────
  private loadSchedules(): void {
    this.agendamentoService.loadSchedules(this.selectedDate()).pipe(takeUntilDestroyed()).subscribe();
  }

  onDateChange(d: string): void {
    this.selectedDate.set(d);
    this.agendamentoService.loadSchedules(d).pipe(takeUntilDestroyed()).subscribe();
  }

  // ─── Week view ─────────────────────────────────────────────────────
  switchView(mode: 'day' | 'week'): void {
    this.viewMode.set(mode);
    if (mode === 'week') this.loadWeek();
    else this.loadSchedules();
  }

  private loadWeek(): void {
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

  switchToDay(date: string): void {
    this.selectedDate.set(date);
    this.viewMode.set('day');
    this.agendamentoService.loadSchedules(date).pipe(takeUntilDestroyed()).subscribe();
  }

  // ─── Availability slots ────────────────────────────────────────────
  private fetchSlots(date: string, serviceId: string): void {
    this.slotsLoading.set(true);
    this.agendamentoService.fetchAvailability(date, serviceId)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (res) => { this.slots.set(res.slots); this.slotsLoading.set(false); },
        error: () => { this.slots.set([]); this.slotsLoading.set(false); },
      });
  }

  selectSlot(slot: AvailabilitySlot): void {
    if (!slot.available) return;
    this.fTime.set(slot.time);
  }

  isSlotSelected(slot: AvailabilitySlot): boolean {
    return slot.time === this.fTime();
  }

  // ─── Dialog ────────────────────────────────────────────────────────
  openNew(): void {
    this.fNome.set('');
    this.fTelefone.set('');
    this.fObs.set('');
    this.fDate.set(this.selectedDate());
    this.fTime.set('09:00');
    if (this.services().length) this.fServiceId.set(this.services()[0].id);
    this.slots.set([]);
    this.dialogVisible.set(true);
  }

  async onDialogSave(): Promise<void> {
    this.saving.set(true);
    try {
      await firstValueFrom(this.agendamentoService.create({
        nomeAvulso:  this.fNome(),
        telefone:    this.fTelefone() || undefined,
        serviceId:   this.fServiceId(),
        dataHora:    this.fDataHora(),
        observacoes: this.fObs() || undefined,
      }));
      this.dialogVisible.set(false);
      this.toast.add({ severity: 'success', summary: 'Agendamento criado', life: 3000 });
      if (this.viewMode() === 'week') this.loadWeek();
      else await firstValueFrom(this.agendamentoService.loadSchedules(this.selectedDate()));
      this.loadMonthSummary();
    } finally {
      this.saving.set(false);
    }
  }

  // ─── Status actions ────────────────────────────────────────────────
  async updateStatus(id: string, status: string): Promise<void> {
    await firstValueFrom(this.agendamentoService.updateStatus(id, status));
    const label = status === 'EM_ATENDIMENTO' ? 'Atendimento iniciado' : 'Serviço concluído';
    this.toast.add({ severity: 'success', summary: label, life: 3000 });
    await firstValueFrom(this.agendamentoService.loadSchedules(this.selectedDate()));
  }

  confirmCancel(s: WashSchedule): void { this.cancelTarget.set(s); }

  async onConfirmCancel(): Promise<void> {
    const s = this.cancelTarget();
    if (!s) return;
    this.cancelTarget.set(null);
    this.cancelling.set(true);
    try {
      await firstValueFrom(this.agendamentoService.cancel(s.id));
      this.toast.add({ severity: 'info', summary: 'Agendamento cancelado', life: 3000 });
      if (this.viewMode() === 'week') this.loadWeek();
      else await firstValueFrom(this.agendamentoService.loadSchedules(this.selectedDate()));
      this.loadMonthSummary();
    } finally {
      this.cancelling.set(false);
    }
  }

  async onPay(metodo: PaymentMethod): Promise<void> {
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

  // ─── Formatters ────────────────────────────────────────────────────
  formatTime(dt: string): string {
    return new Date(dt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  formatWeekDay(date: string): string {
    return new Date(date + 'T12:00:00')
      .toLocaleDateString('pt-BR', { weekday: 'short' })
      .replace('.', '').toUpperCase();
  }

  formatDayShort(date: string): string {
    return new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }

  formatDayFull(date: string): string {
    return new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', {
      weekday: 'long', day: '2-digit', month: 'long',
    });
  }
}
