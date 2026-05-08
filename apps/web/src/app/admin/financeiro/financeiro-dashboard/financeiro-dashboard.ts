import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  computed,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { FinanceiroService } from '../financeiro.service';
import PageHeaderComponent from '@shared/components/page-header/page-header';
import AppButtonComponent from '@shared/components/app-button/app-button';
import CurrencyBrlPipe from '@shared/pipes/currency-brl.pipe';

Chart.register(...registerables);

@Component({
  selector: 'lync-financeiro-dashboard',
  imports: [FormsModule, PageHeaderComponent, AppButtonComponent, CurrencyBrlPipe],
  templateUrl: './financeiro-dashboard.html',
  styleUrl: './financeiro-dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class FinanceiroDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly financeiroService = inject(FinanceiroService);
  private paymentChart?: Chart;
  private receivablesChart?: Chart;

  @ViewChild('paymentMethodsCanvas') paymentMethodsCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('receivablesAgingCanvas') receivablesAgingCanvas?: ElementRef<HTMLCanvasElement>;

  readonly loading = this.financeiroService.loading;
  readonly error = this.financeiroService.error;
  readonly summary = this.financeiroService.summary;
  readonly receivables = this.financeiroService.receivables;
  readonly maintenance = this.financeiroService.maintenance;
  readonly stockCosts = this.financeiroService.stockCosts;
  readonly paymentMethods = this.financeiroService.paymentMethods;

  readonly from = signal(this.firstDayOfMonth());
  readonly to = signal(this.today());
  readonly filterError = signal<string | null>(null);

  readonly periodLabel = computed(() => {
    const start = new Date(this.from());
    const end = new Date(this.to());
    const diff = Math.max(1, Math.floor((end.getTime() - start.getTime()) / 86400000) + 1);
    return `${diff} dia(s)`;
  });

  readonly hasInvalidRange = computed(() => this.from() > this.to());

  readonly averageTicket = computed(() => {
    const pm = this.paymentMethods();
    if (!pm || pm.totalQuantidade <= 0) return 0;
    return pm.totalValor / pm.totalQuantidade;
  });

  readonly outstandingRate = computed(() => {
    const s = this.summary();
    const r = this.receivables();
    if (!s || s.receita.total <= 0 || !r) return 0;
    return (r.totalPendente / s.receita.total) * 100;
  });

  readonly overdueTopContracts = computed(() => {
    const r = this.receivables();
    if (!r) return [];
    return [...r.data]
      .filter((item) => item.overdue && item.pendente > 0)
      .sort((a, b) => b.pendente - a.pendente)
      .slice(0, 5);
  });

  readonly mostProfitableVehicles = computed(() => {
    const m = this.maintenance();
    if (!m) return [];
    return [...m.veiculos]
      .sort((a, b) => b.lucroBruto - a.lucroBruto)
      .slice(0, 5);
  });

  ngOnInit() {
    this.reload();
  }

  ngAfterViewInit() {
    this.renderPaymentMethodsChart();
    this.renderReceivablesAgingChart();
  }

  async reload() {
    if (this.hasInvalidRange()) {
      this.filterError.set('A data inicial deve ser menor ou igual à data final.');
      return;
    }
    this.filterError.set(null);
    await this.financeiroService.load(this.from(), this.to());
    this.renderPaymentMethodsChart();
    this.renderReceivablesAgingChart();
  }

  ngOnDestroy() {
    this.paymentChart?.destroy();
    this.receivablesChart?.destroy();
  }

  applyPreset(preset: 'today' | 'last7' | 'last30' | 'month') {
    const end = new Date();
    const start = new Date();

    if (preset === 'today') {
      // keep both dates as today
    } else if (preset === 'last7') {
      start.setDate(end.getDate() - 6);
    } else if (preset === 'last30') {
      start.setDate(end.getDate() - 29);
    } else {
      start.setDate(1);
    }

    this.from.set(start.toISOString().slice(0, 10));
    this.to.set(end.toISOString().slice(0, 10));
  }

  exportCsv() {
    const s = this.summary();
    const r = this.receivables();
    const m = this.maintenance();
    const st = this.stockCosts();
    if (!s) return;

    const rows: string[] = [];
    rows.push('secao;item;valor');
    rows.push(`resumo;Receita Total;${s.receita.total}`);
    rows.push(`resumo;Custos Diretos;${s.custos.total}`);
    rows.push(`resumo;Margem Bruta;${s.margem.bruta}`);
    rows.push(`resumo;Margem Percentual;${s.margem.percentual.toFixed(2)}`);

    if (r) {
      rows.push(`recebiveis;Total Pendente;${r.totalPendente}`);
      for (const row of r.data) {
        rows.push(`recebiveis;Contrato ${row.contractId};${row.pendente}`);
      }
    }

    if (m) {
      for (const row of m.veiculos) {
        rows.push(`rentabilidade;${row.placa};${row.lucroBruto}`);
      }
    }

    if (st) {
      rows.push(`estoque;Valor Estoque Atual;${st.valorEstoqueAtual}`);
      rows.push(`estoque;COGS Periodo;${st.custoTotal}`);
    }

    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financeiro-${this.from()}-${this.to()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  exportPdf() {
    window.print();
  }

  private renderPaymentMethodsChart() {
    const canvas = this.paymentMethodsCanvas?.nativeElement;
    const methods = this.paymentMethods();
    if (!canvas || !methods) return;

    this.paymentChart?.destroy();
    this.paymentChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: methods.data.map((d) => this.labelMetodo(d.metodo)),
        datasets: [{
          data: methods.data.map((d) => d.valor),
          backgroundColor: ['#14b8a6', '#3b82f6', '#8b5cf6', '#f59e0b'],
          borderColor: '#fff',
          borderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' },
        },
      },
    });
  }

  private renderReceivablesAgingChart() {
    const canvas = this.receivablesAgingCanvas?.nativeElement;
    const receivables = this.receivables();
    if (!canvas || !receivables) return;

    this.receivablesChart?.destroy();
    this.receivablesChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: ['Vencidos', 'A vencer'],
        datasets: [{
          data: [receivables.aging.vencidos, receivables.aging.aVencer],
          backgroundColor: ['#ef4444', '#10b981'],
          borderRadius: 8,
          maxBarThickness: 70,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            ticks: {
              callback: (value) => `R$ ${Number(value).toLocaleString('pt-BR')}`,
            },
          },
        },
      },
    });
  }

  formatDate(value?: string | Date | null): string {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('pt-BR');
  }

  private labelMetodo(metodo: string) {
    const labels: Record<string, string> = {
      DINHEIRO: 'Dinheiro',
      PIX: 'Pix',
      CARTAO_CREDITO: 'Cartão Crédito',
      CARTAO_DEBITO: 'Cartão Débito',
    };
    return labels[metodo] ?? metodo;
  }

  private today() {
    return new Date().toISOString().slice(0, 10);
  }

  private firstDayOfMonth() {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  }
}

