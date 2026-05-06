import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '@core/services/api.service';
import { Product } from '@shared/models/entities.model';

interface DashboardKpis {
  usersCount: number;
  vehiclesCount: number;
  customersCount: number;
  servicesCount: number;
  lowStock: Product[];
}

@Component({
  selector: 'lync-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DashboardComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly loading = signal(true);
  readonly usersCount = signal(0);
  readonly vehiclesCount = signal(0);
  readonly customersCount = signal(0);
  readonly servicesCount = signal(0);
  readonly lowStockProducts = signal<Product[]>([]);
  readonly error = signal<string | null>(null);

  ngOnInit() { this.loadKpis(); }

  loadKpis() {
    this.loading.set(true);
    this.error.set(null);
    // A10: Single aggregated request replaces 5 parallel calls. Q6: removed dead `computed` import.
    this.api.get<DashboardKpis>('/reports/dashboard').subscribe({
      next: (kpis) => {
        this.usersCount.set(kpis.usersCount);
        this.vehiclesCount.set(kpis.vehiclesCount);
        this.customersCount.set(kpis.customersCount);
        this.servicesCount.set(kpis.servicesCount);
        this.lowStockProducts.set(kpis.lowStock);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Erro ao carregar dashboard.');
        this.loading.set(false);
      },
    });
  }
}
