import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { FrotaService } from './frota.service';

describe('FrotaService', () => {
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
        FrotaService,
        { provide: ApiService, useValue: api },
      ],
    });
  });

  it('loads vehicles from paginated response', () => {
    const service = TestBed.inject(FrotaService);
    api.get.mockReturnValue(of({ data: [{ id: 'v1', placa: 'ABC-1234' }] }));

    service.load().subscribe();

    expect(service.veiculos()).toEqual([{ id: 'v1', placa: 'ABC-1234' }]);
  });
});

