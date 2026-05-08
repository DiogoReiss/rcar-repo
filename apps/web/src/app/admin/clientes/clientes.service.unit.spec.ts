import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { ClientesService } from './clientes.service';

describe('ClientesService', () => {
  const api = {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        ClientesService,
        { provide: ApiService, useValue: api },
      ],
    });
  });

  it('loads paginated customers and updates metadata signals', () => {
    const service = TestBed.inject(ClientesService);
    api.get.mockReturnValue(of({ data: [{ id: 'c1', nome: 'A' }], total: 1, page: 1, perPage: 50, totalPages: 1 }));

    service.load('a').subscribe();

    expect(service.clientes()).toEqual([{ id: 'c1', nome: 'A' }]);
    expect(service.total()).toBe(1);
    expect(service.totalPages()).toBe(1);
  });
});

