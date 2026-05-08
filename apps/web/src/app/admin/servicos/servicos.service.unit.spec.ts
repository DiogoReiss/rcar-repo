import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { ServicosService } from './servicos.service';

describe('ServicosService', () => {
  const api = {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        ServicosService,
        { provide: ApiService, useValue: api },
      ],
    });
  });

  it('loads services from paginated response shape', () => {
    const service = TestBed.inject(ServicosService);
    api.get.mockReturnValue(of({ data: [{ id: 's1', nome: 'Lavagem' }] }));

    service.load().subscribe();

    expect(service.servicos()).toEqual([{ id: 's1', nome: 'Lavagem' }]);
  });
});

