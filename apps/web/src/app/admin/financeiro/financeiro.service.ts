import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from '@core/services/api.service';
import {
  FinancialSummary,
  RentalReceivablesReport,
  MaintenanceCostsReport,
  StockCostAnalysisReport,
  PaymentMethodSummaryReport,
} from '@shared/models/entities.model';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FinanceiroService {
  private readonly api = inject(ApiService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly summary = signal<FinancialSummary | null>(null);
  readonly receivables = signal<RentalReceivablesReport | null>(null);
  readonly maintenance = signal<MaintenanceCostsReport | null>(null);
  readonly stockCosts = signal<StockCostAnalysisReport | null>(null);
  readonly paymentMethods = signal<PaymentMethodSummaryReport | null>(null);

  async load(from?: string, to?: string) {
    this.loading.set(true);
    this.error.set(null);
    try {
      const query = from && to ? `?from=${from}&to=${to}` : '';
      const [summary, receivables, maintenance, stockCosts, paymentMethods] = await Promise.all([
        firstValueFrom(this.api.get<FinancialSummary>(`/reports/financial-summary${query}`)),
        firstValueFrom(this.api.get<RentalReceivablesReport>('/reports/rental/receivables')),
        firstValueFrom(this.api.get<MaintenanceCostsReport>(`/reports/fleet/maintenance-costs${query}`)),
        firstValueFrom(this.api.get<StockCostAnalysisReport>(`/reports/stock/cost-analysis${query}`)),
        firstValueFrom(this.api.get<PaymentMethodSummaryReport>(`/payments/method-summary${query}`)),
      ]);

      this.summary.set(summary);
      this.receivables.set(receivables);
      this.maintenance.set(maintenance);
      this.stockCosts.set(stockCosts);
      this.paymentMethods.set(paymentMethods);
    } catch {
      this.error.set('Falha ao carregar dados financeiros.');
    } finally {
      this.loading.set(false);
    }
  }
}

