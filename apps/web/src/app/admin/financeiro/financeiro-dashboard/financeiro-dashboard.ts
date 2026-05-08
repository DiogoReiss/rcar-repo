import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FinanceiroService } from '../financeiro.service';
import PageHeaderComponent from '@shared/components/page-header/page-header';
import AppButtonComponent from '@shared/components/app-button/app-button';
import CurrencyBrlPipe from '@shared/pipes/currency-brl.pipe';

@Component({
  selector: 'lync-financeiro-dashboard',
  imports: [FormsModule, PageHeaderComponent, AppButtonComponent, CurrencyBrlPipe],
  templateUrl: './financeiro-dashboard.html',
  styleUrl: './financeiro-dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class FinanceiroDashboardComponent implements OnInit {
  private readonly financeiroService = inject(FinanceiroService);

  readonly loading = this.financeiroService.loading;
  readonly error = this.financeiroService.error;
  readonly summary = this.financeiroService.summary;
  readonly receivables = this.financeiroService.receivables;
  readonly maintenance = this.financeiroService.maintenance;
  readonly stockCosts = this.financeiroService.stockCosts;

  readonly from = signal(this.firstDayOfMonth());
  readonly to = signal(this.today());

  ngOnInit() {
    this.reload();
  }

  async reload() {
    await this.financeiroService.load(this.from(), this.to());
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

