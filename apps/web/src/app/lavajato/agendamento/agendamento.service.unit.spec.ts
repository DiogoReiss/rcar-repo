import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { AgendamentoService } from './agendamento.service';

describe('AgendamentoService', () => {
  const api = {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        AgendamentoService,
        { provide: ApiService, useValue: api },
      ],
    });
  });

  it('loads schedules into signal', () => {
    const service = TestBed.inject(AgendamentoService);
    api.get.mockReturnValue(of([{ id: 'a1' }]));

    service.loadSchedules('2026-05-08').subscribe();

    expect(service.schedules()).toEqual([{ id: 'a1' }]);
    expect(service.loading()).toBe(false);
  });

  it('builds month summary from schedules', () => {
    const service = TestBed.inject(AgendamentoService);
    api.get.mockReturnValue(of([
      { dataHora: '2026-05-08T10:00:00.000Z' },
      { dataHora: '2026-05-08T11:00:00.000Z' },
      { dataHora: '2026-05-09T10:00:00.000Z' },
    ]));

    service.loadMonthSummary('2026-05').subscribe();

    expect(service.monthSummary()).toEqual({
      '2026-05-08': 2,
      '2026-05-09': 1,
    });
  });
});

