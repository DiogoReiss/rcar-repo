import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
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

  @ViewChild('paymentMethodsCanvas') paymentMethodsCanvas?: ElementRef<HTMLCanvasElement>;

  readonly loading = this.financeiroService.loading;
  readonly error = this.financeiroService.error;
  readonly summary = this.financeiroService.summary;
  readonly receivables = this.financeiroService.receivables;
  readonly maintenance = this.financeiroService.maintenance;
  readonly stockCosts = this.financeiroService.stockCosts;
  readonly paymentMethods = this.financeiroService.paymentMethods;

  readonly from = signal(this.firstDayOfMonth());
  readonly to = signal(this.today());

  ngOnInit() {
    this.reload();
  }

  ngAfterViewInit() {
    this.renderPaymentMethodsChart();
  }

  async reload() {
    await this.financeiroService.load(this.from(), this.to());
    this.renderPaymentMethodsChart();
  }

  ngOnDestroy() {
    this.paymentChart?.destroy();
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

