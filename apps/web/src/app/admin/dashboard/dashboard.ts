import {
  ChangeDetectionStrategy, Component, inject, signal,
  OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, DestroyRef,
  afterNextRender, Injector,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Chart, registerables } from 'chart.js';
import { ApiService } from '@core/services/api.service';
import { Product } from '@shared/models/entities.model';

Chart.register(...registerables);

// Shared Chart.js defaults aligned with brand palette
const CHART_DEFAULTS = {
  font: { family: "'Inter', sans-serif", size: 12 },
  grid: { color: 'rgba(0,0,0,0.05)', drawBorder: false },
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
} as const;

interface DashboardKpis {
  usersCount: number;
  vehiclesCount: number;
  customersCount: number;
  servicesCount: number;
  lowStock: Product[];
}

interface DailySummary {
  lavajato: { agendados: number; concluidos: number; cancelados: number; walkins: number; receita: number };
  aluguel:  { novasReservas: number; receita: number };
}

interface MonthlyStat {
  receita: { lavajato: number; aluguel: number; total: number };
  novosClientes: number;
  novosContratos: number;
}

interface ChartsData {
  weeklyServices: { labels: string[]; data: number[] };
  rushHour: { labels: string[]; data: number[] };
  incomeOutcome: { labels: string[]; income: number[]; outcome: number[] };
  productUsage: { labels: string[]; data: number[] };
}

type DashboardChartsPeriod = '7d' | '30d' | 'month';

@Component({
  selector: 'lync-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly api = inject(ApiService);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private charts: Chart[] = [];

  /** Used by the template to render skeleton placeholders. */
  readonly skeletons = [1, 2, 3, 4];

  @ViewChild('weeklyServicesCanvas')  weeklyServicesCanvas!:  ElementRef<HTMLCanvasElement>;
  @ViewChild('rushHourCanvas')        rushHourCanvas!:        ElementRef<HTMLCanvasElement>;
  @ViewChild('incomeOutcomeCanvas')   incomeOutcomeCanvas!:   ElementRef<HTMLCanvasElement>;
  @ViewChild('productUsageCanvas')    productUsageCanvas!:    ElementRef<HTMLCanvasElement>;
  @ViewChild('revenueSourcesCanvas')  revenueSourcesCanvas!:  ElementRef<HTMLCanvasElement>;

  readonly loading        = signal(true);
  readonly chartsLoading  = signal(true);
  readonly usersCount     = signal(0);
  readonly vehiclesCount  = signal(0);
  readonly customersCount = signal(0);
  readonly servicesCount  = signal(0);
  readonly lowStockProducts = signal<Product[]>([]);
  readonly chartsPeriod = signal<DashboardChartsPeriod>('7d');
  readonly chartsPeriodOptions: ReadonlyArray<{ value: DashboardChartsPeriod; label: string }> = [
    { value: '7d', label: '7 dias' },
    { value: '30d', label: '30 dias' },
    { value: 'month', label: 'Mês atual' },
  ];

  // Today's operational summary
  readonly dailySummary   = signal<DailySummary | null>(null);
  readonly dailyLoading   = signal(true);

  // This month's revenue breakdown
  readonly monthlyStat    = signal<MonthlyStat | null>(null);
  readonly monthlyLoading = signal(true);

  private chartsData: ChartsData | null = null;
  private viewReady = false;

  constructor() {
    // A16: takeUntilDestroyed keeps both subscriptions tied to component lifecycle
    this.api.get<DashboardKpis>('/reports/dashboard')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (kpis) => {
          this.usersCount.set(kpis.usersCount);
          this.vehiclesCount.set(kpis.vehiclesCount);
          this.customersCount.set(kpis.customersCount);
          this.servicesCount.set(kpis.servicesCount);
          this.lowStockProducts.set(kpis.lowStock);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });

    this.loadChartsData();

    // Today's operational summary
    this.api.get<DailySummary>('/reports/daily')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (d) => { this.dailySummary.set(d); this.dailyLoading.set(false); },
        error: ()  => this.dailyLoading.set(false),
      });

    // This month's revenue breakdown (drives the Revenue Sources chart)
    this.api.get<MonthlyStat>('/reports/monthly')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (m) => {
          this.monthlyStat.set(m);
          this.monthlyLoading.set(false);
          if (this.viewReady) {
            afterNextRender(() => this.renderRevenueSourcesChart(), { injector: this.injector });
          }
        },
        error: () => this.monthlyLoading.set(false),
      });
  }

  ngOnInit() {}

  ngAfterViewInit() {
    this.viewReady = true;
    if (this.chartsData)    this.renderCharts();
    if (this.monthlyStat()) this.renderRevenueSourcesChart();
  }

  ngOnDestroy() {
    this.charts.forEach(c => c.destroy());
  }

  formatBRL(v: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  }

  onChartsPeriodChange(period: DashboardChartsPeriod) {
    if (period === this.chartsPeriod()) {
      return;
    }
    this.chartsPeriod.set(period);
    this.loadChartsData();
  }

  chartsPeriodText(): string {
    const period = this.chartsPeriod();
    if (period === '30d') return 'Últimos 30 dias';
    if (period === 'month') return 'Mês atual';
    return 'Últimos 7 dias';
  }

  private loadChartsData() {
    this.chartsLoading.set(true);
    const period = this.chartsPeriod();
    this.api.get<ChartsData>(`/reports/charts?period=${period}`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.chartsData = data;
          this.chartsLoading.set(false);
          if (this.viewReady) {
            afterNextRender(() => this.renderCharts(), { injector: this.injector });
          }
        },
        error: () => this.chartsLoading.set(false),
      });
  }

  private renderCharts() {
    const d = this.chartsData!;
    this.charts.forEach(c => c.destroy());
    this.charts = [];

    // Weekly services — bar (brand blue)
    this.charts.push(new Chart(this.weeklyServicesCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: d.weeklyServices.labels,
        datasets: [{
          label: 'Serviços',
          data: d.weeklyServices.data,
          backgroundColor: 'rgba(9,131,236,0.85)',
          borderRadius: 6,
          borderSkipped: false,
        }],
      },
      options: {
        ...CHART_DEFAULTS,
        scales: {
          x: { grid: CHART_DEFAULTS.grid, ticks: { font: CHART_DEFAULTS.font } },
          y: { grid: CHART_DEFAULTS.grid, ticks: { font: CHART_DEFAULTS.font, precision: 0 }, beginAtZero: true },
        },
      },
    }));

    // Rush hour — line (purple)
    this.charts.push(new Chart(this.rushHourCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: d.rushHour.labels,
        datasets: [{
          label: 'Atendimentos',
          data: d.rushHour.data,
          borderColor: '#7c3aed',
          backgroundColor: 'rgba(124,58,237,0.08)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#7c3aed',
          pointRadius: 4,
        }],
      },
      options: {
        ...CHART_DEFAULTS,
        scales: {
          x: { grid: CHART_DEFAULTS.grid, ticks: { font: CHART_DEFAULTS.font } },
          y: { grid: CHART_DEFAULTS.grid, ticks: { font: CHART_DEFAULTS.font, precision: 0 }, beginAtZero: true },
        },
      },
    }));

    // Income vs outcome — grouped bar
    this.charts.push(new Chart(this.incomeOutcomeCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: d.incomeOutcome.labels,
        datasets: [
          {
            label: 'Receita (R$)',
            data: d.incomeOutcome.income,
            backgroundColor: 'rgba(56,142,60,0.85)',
            borderRadius: 5,
            borderSkipped: false,
          },
          {
            label: 'Saídas (Qtd)',
            data: d.incomeOutcome.outcome,
            backgroundColor: 'rgba(211,47,47,0.75)',
            borderRadius: 5,
            borderSkipped: false,
          },
        ],
      },
      options: {
        ...CHART_DEFAULTS,
        plugins: { legend: { display: true, labels: { font: CHART_DEFAULTS.font, boxWidth: 12, padding: 16 } } },
        scales: {
          x: { grid: CHART_DEFAULTS.grid, ticks: { font: CHART_DEFAULTS.font } },
          y: { grid: CHART_DEFAULTS.grid, ticks: { font: CHART_DEFAULTS.font }, beginAtZero: true },
        },
      },
    }));

    // Product usage — doughnut
    if (d.productUsage.labels.length) {
      this.charts.push(new Chart(this.productUsageCanvas.nativeElement, {
        type: 'doughnut',
        data: {
          labels: d.productUsage.labels,
          datasets: [{
            data: d.productUsage.data,
            backgroundColor: [
              '#0983ec','#7c3aed','#388e3c','#ec8609',
              '#d32f2f','#0288d1','#be185d','#15803d','#9333ea','#ea580c',
            ],
            borderWidth: 2,
            borderColor: '#fff',
          }],
        },
        options: {
          ...CHART_DEFAULTS,
          plugins: {
            legend: {
              display: true,
              position: 'right',
              labels: { font: CHART_DEFAULTS.font, boxWidth: 12, padding: 12 },
            },
          },
          cutout: '62%',
        },
      }));
    }
  }

  private renderRevenueSourcesChart() {
    const m = this.monthlyStat();
    if (!m || !this.revenueSourcesCanvas) return;

    // Destroy previous instance if re-rendering
    const prev = this.charts.findIndex(c => (c as any)._tag === 'revenueSources');
    if (prev >= 0) { this.charts[prev].destroy(); this.charts.splice(prev, 1); }

    const chart = new Chart(this.revenueSourcesCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Lavajato', 'Aluguel'],
        datasets: [{
          data: [m.receita.lavajato, m.receita.aluguel],
          backgroundColor: ['rgba(236,134,9,0.9)', 'rgba(9,131,236,0.9)'],
          borderWidth: 3,
          borderColor: '#fff',
          hoverOffset: 8,
        }],
      },
      options: {
        ...CHART_DEFAULTS,
        plugins: {
          legend: { display: true, position: 'bottom', labels: { font: CHART_DEFAULTS.font, boxWidth: 12, padding: 16 } },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ctx.parsed)}`,
            },
          },
        },
        cutout: '60%',
      },
    });
    (chart as any)._tag = 'revenueSources';
    this.charts.push(chart);
  }
}
