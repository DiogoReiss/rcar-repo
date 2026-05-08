import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import DashboardComponent from './dashboard';

class ApiServiceMock {
  readonly get = vi.fn((path: string) => {
    if (path === '/reports/dashboard') {
      return of({ usersCount: 1, vehiclesCount: 2, customersCount: 3, servicesCount: 4, lowStock: [] });
    }

    if (path === '/reports/daily') {
      return of({
        lavajato: { agendados: 1, concluidos: 1, cancelados: 0, walkins: 0, receita: 100 },
        aluguel: { novasReservas: 1, receita: 200 },
      });
    }

    if (path === '/reports/monthly') {
      return of({ receita: { lavajato: 1000, aluguel: 500, total: 1500 }, novosClientes: 2, novosContratos: 1 });
    }

    return of({
      weeklyServices: { labels: ['A'], data: [1] },
      rushHour: { labels: ['08h'], data: [1] },
      incomeOutcome: { labels: ['A'], income: [100], outcome: [1] },
      productUsage: { labels: ['Produto'], data: [1] },
    });
  });
}

describe('DashboardComponent period selector', () => {
  it('loads charts with default period and updates query when period changes', async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        { provide: ApiService, useClass: ApiServiceMock },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;
    const api = TestBed.inject(ApiService) as unknown as ApiServiceMock;

    expect(api.get).toHaveBeenCalledWith('/reports/charts?period=7d');

    component.onChartsPeriodChange('30d');

    expect(api.get).toHaveBeenCalledWith('/reports/charts?period=30d');
    expect(component.chartsPeriod()).toBe('30d');
  });
});

