import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
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
        UsersService,
        { provide: ApiService, useValue: api },
      ],
    });
  });

  it('loads users into signal', () => {
    const service = TestBed.inject(UsersService);
    api.get.mockReturnValue(of([{ id: 'u1', nome: 'Ana' }]));

    service.load().subscribe();

    expect(service.users()).toEqual([{ id: 'u1', nome: 'Ana' }]);
    expect(service.loading()).toBe(false);
  });

  it('creates and appends user', () => {
    const service = TestBed.inject(UsersService);
    api.post.mockReturnValue(of({ id: 'u2', nome: 'Maria' }));

    service.create({ nome: 'Maria', email: 'm@x.com', role: 'OPERADOR', ativo: true, senha: '12345678' } as never).subscribe();

    expect(service.users()).toContainEqual({ id: 'u2', nome: 'Maria' });
  });
});

