import { ChangeDetectionStrategy, Component, inject, signal, OnInit, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '@core/services/api.service';
import { firstValueFrom } from 'rxjs';
import { Product } from '@shared/models/entities.model';

interface KpiCard { label: string; value: string | number; icon: string; route?: string; highlight?: boolean; }

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

  ngOnInit() { this.loadKpis(); }

  async loadKpis() {
    this.loading.set(true);
    try {
      const [users, vehicles, customers, services, lowStock] = await Promise.allSettled([
        firstValueFrom(this.api.get<unknown[]>('/users')),
        firstValueFrom(this.api.get<unknown[]>('/fleet')),
        firstValueFrom(this.api.get<unknown[]>('/customers')),
        firstValueFrom(this.api.get<unknown[]>('/wash/services')),
        firstValueFrom(this.api.get<Product[]>('/inventory/products/low-stock')),
      ]);
      if (users.status === 'fulfilled') this.usersCount.set((users.value as unknown[]).length);
      if (vehicles.status === 'fulfilled') this.vehiclesCount.set((vehicles.value as unknown[]).length);
      if (customers.status === 'fulfilled') this.customersCount.set((customers.value as unknown[]).length);
      if (services.status === 'fulfilled') this.servicesCount.set((services.value as unknown[]).length);
      if (lowStock.status === 'fulfilled') this.lowStockProducts.set(lowStock.value);
    } finally { this.loading.set(false); }
  }
}
