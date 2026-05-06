import { ChangeDetectionStrategy, Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '@core/services/api.service';
import { firstValueFrom } from 'rxjs';
import { WashQueueEntry, WashService } from '@shared/models/entities.model';
import { environment } from '@env/environment';

@Component({
  selector: 'lync-fila-painel',
  imports: [FormsModule],
  templateUrl: './fila-painel.html',
  styleUrl: './fila-painel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class FilaPainelComponent implements OnInit, OnDestroy {
  private readonly api = inject(ApiService);
  private sse: EventSource | null = null;

  readonly queue = signal<WashQueueEntry[]>([]);
  readonly services = signal<WashService[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly lastUpdate = signal('');

  readonly showForm = signal(false);
  readonly formLoading = signal(false);
  readonly formError = signal<string | null>(null);
  readonly formNome = signal('');
  readonly formServiceId = signal('');
  readonly formPlaca = signal('');

  readonly payingId = signal<string | null>(null);
  readonly payMethod = signal('PIX');

  readonly statusLabel: Record<string, string> = { AGUARDANDO: 'Aguardando', EM_ATENDIMENTO: 'Em Atendimento', CONCLUIDO: 'Concluído' };
  readonly statusClass: Record<string, string> = { AGUARDANDO: 'badge--warning', EM_ATENDIMENTO: 'badge--operador', CONCLUIDO: 'badge--success' };

  ngOnInit() {
    this.loadServices();
    this.loadQueue();
    this.connectSSE();
  }

  ngOnDestroy() { this.sse?.close(); }

  private connectSSE() {
    const token = localStorage.getItem('rcar_access_token') ?? '';
    this.sse = new EventSource(`${environment.apiUrl}/lavajato/queue/stream`);
    this.sse.onmessage = () => {
      this.lastUpdate.set(new Date().toLocaleTimeString('pt-BR'));
      this.loadQueue();
    };
  }

  async loadServices() {
    try {
      const res = await firstValueFrom(this.api.get<WashService[]>('/wash/services'));
      this.services.set(res);
      if (res.length) this.formServiceId.set(res[0].id);
    } catch { /* silent */ }
  }

  async loadQueue() {
    this.loading.set(true);
    try {
      const res = await firstValueFrom(this.api.get<WashQueueEntry[]>('/lavajato/queue'));
      this.queue.set(res);
    } catch (e: any) { this.error.set('Erro ao carregar fila.'); }
    finally { this.loading.set(false); }
  }

  async onAddToQueue() {
    this.formLoading.set(true); this.formError.set(null);
    try {
      await firstValueFrom(this.api.post('/lavajato/queue', {
        nomeAvulso: this.formNome(), serviceId: this.formServiceId(),
        veiculoPlaca: this.formPlaca() || undefined,
      }));
      this.showForm.set(false);
      this.formNome.set(''); this.formPlaca.set('');
      await this.loadQueue();
    } catch (e: any) {
      this.formError.set(e?.error?.message ?? 'Erro ao entrar na fila.');
    } finally { this.formLoading.set(false); }
  }

  async onAdvance(id: string) {
    await firstValueFrom(this.api.patch(`/lavajato/queue/${id}/advance`, {}));
    await this.loadQueue();
  }

  async onPay(id: string) {
    await firstValueFrom(this.api.post(`/lavajato/queue/${id}/payment`, { metodo: this.payMethod() }));
    this.payingId.set(null);
    await this.loadQueue();
  }

  readonly aguardando = () => this.queue().filter(q => q.status === 'AGUARDANDO');
  readonly emAtendimento = () => this.queue().filter(q => q.status === 'EM_ATENDIMENTO');
  formatPrice(v: number) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v); }
}
