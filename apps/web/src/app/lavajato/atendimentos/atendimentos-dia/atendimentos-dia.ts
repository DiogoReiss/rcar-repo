import { ChangeDetectionStrategy, Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '@core/services/api.service';
import { firstValueFrom } from 'rxjs';
import { WashSchedule, WashQueueEntry } from '@shared/models/entities.model';
import PageHeaderComponent from '@shared/components/page-header/page-header';

interface AtendimentosDia { schedules: WashSchedule[]; queues: WashQueueEntry[]; }

@Component({
  selector: 'lync-atendimentos-dia',
  imports: [FormsModule, PageHeaderComponent],
  templateUrl: './atendimentos-dia.html',
  styleUrl: './atendimentos-dia.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AtendimentosDiaComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly selectedDate = signal(new Date().toISOString().slice(0, 10));
  readonly data = signal<AtendimentosDia>({ schedules: [], queues: [] });
  readonly loading = signal(false);

  readonly total = computed(() => this.data().schedules.length + this.data().queues.length);
  readonly revenue = computed(() => {
    const scheduleSum = this.data().schedules.reduce((s, x) => s + Number(x.service?.preco ?? 0), 0);
    const queueSum = this.data().queues.reduce((s, x) => s + Number(x.service?.preco ?? 0), 0);
    return scheduleSum + queueSum;
  });

  ngOnInit() { this.load(); }

  async load() {
    this.loading.set(true);
    try {
      const res = await firstValueFrom(this.api.get<AtendimentosDia>(`/lavajato/atendimentos?date=${this.selectedDate()}`));
      this.data.set(res);
    } finally { this.loading.set(false); }
  }

  onDateChange(d: string) { this.selectedDate.set(d); this.load(); }
  formatPrice(v: number) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v); }
  formatTime(dt: string) { return new Date(dt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); }
}
