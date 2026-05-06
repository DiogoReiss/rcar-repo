import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '@core/services/api.service';
import { firstValueFrom } from 'rxjs';
import { WashSchedule, WashService } from '@shared/models/entities.model';

@Component({
  selector: 'lync-calendario',
  imports: [FormsModule],
  templateUrl: './calendario.html',
  styleUrl: './calendario.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class CalendarioComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly selectedDate = signal(new Date().toISOString().slice(0, 10));
  readonly schedules = signal<WashSchedule[]>([]);
  readonly services = signal<WashService[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly showForm = signal(false);
  readonly formLoading = signal(false);
  readonly formError = signal<string | null>(null);
  readonly formNome = signal('');
  readonly formTelefone = signal('');
  readonly formServiceId = signal('');
  readonly formDataHora = signal(`${new Date().toISOString().slice(0, 10)}T09:00`);
  readonly formObs = signal('');

  readonly payingId = signal<string | null>(null);
  readonly payMethod = signal('PIX');

  readonly statusLabel: Record<string, string> = { AGENDADO: 'Agendado', EM_ATENDIMENTO: 'Em Atend.', CONCLUIDO: 'Concluído', CANCELADO: 'Cancelado' };
  readonly statusClass: Record<string, string> = { AGENDADO: 'badge--warning', EM_ATENDIMENTO: 'badge--operador', CONCLUIDO: 'badge--success', CANCELADO: 'badge--inactive' };

  ngOnInit() { this.loadServices(); this.loadSchedules(); }

  async loadServices() {
    try {
      const res = await firstValueFrom(this.api.get<WashService[]>('/wash/services'));
      this.services.set(res);
      if (res.length) this.formServiceId.set(res[0].id);
    } catch { /* silent */ }
  }

  async loadSchedules() {
    this.loading.set(true); this.error.set(null);
    try {
      const res = await firstValueFrom(this.api.get<WashSchedule[]>(`/lavajato/schedules?date=${this.selectedDate()}`));
      this.schedules.set(res);
    } catch { this.error.set('Erro ao carregar agendamentos.'); }
    finally { this.loading.set(false); }
  }

  onDateChange(d: string) { this.selectedDate.set(d); this.loadSchedules(); }

  async onSubmit() {
    this.formLoading.set(true); this.formError.set(null);
    try {
      await firstValueFrom(this.api.post('/lavajato/schedules', {
        nomeAvulso: this.formNome(), telefone: this.formTelefone() || undefined,
        serviceId: this.formServiceId(),
        dataHora: new Date(this.formDataHora()).toISOString(),
        observacoes: this.formObs() || undefined,
      }));
      this.showForm.set(false);
      this.formNome.set(''); this.formTelefone.set(''); this.formObs.set('');
      await this.loadSchedules();
    } catch (e: any) {
      this.formError.set(e?.error?.message ?? 'Erro ao criar agendamento.');
    } finally { this.formLoading.set(false); }
  }

  async updateStatus(id: string, status: string) {
    await firstValueFrom(this.api.patch(`/lavajato/schedules/${id}/status`, { status }));
    await this.loadSchedules();
  }

  async onPay(id: string) {
    await firstValueFrom(this.api.post(`/lavajato/schedules/${id}/payment`, { metodo: this.payMethod() }));
    this.payingId.set(null);
    await this.loadSchedules();
  }

  formatTime(dt: string) { return new Date(dt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); }
  formatPrice(v: number) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v); }
}
