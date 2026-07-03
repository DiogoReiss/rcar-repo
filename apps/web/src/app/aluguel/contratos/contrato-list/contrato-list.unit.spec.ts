import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MessageService } from 'primeng/api';
import { ApiService } from '@core/services/api.service';
import { AuthService } from '@core/auth/services/auth.service';
import ContratoListComponent from './contrato-list';

describe('ContratoListComponent', () => {
  const apiMock = {
    get: vi.fn((path: string) => {
      if (path.startsWith('/rental/contracts')) {
        if (path.includes('?')) return of({ data: [] });
        return of({
          id: 'contract-1',
          valorTotal: 350,
          vehicle: { kmAtual: 12000 },
          customer: { nome: 'Cliente' },
        });
      }
      if (path === '/customers') return of([]);
      return of([]);
    }),
    patch: vi.fn(() => of({})),
    post: vi.fn(() => of({})),
    postBlob: vi.fn(() => of(new Blob())),
  };

  const toastMock = {
    add: vi.fn(),
  };

  const authMock = {
    currentUser: () => ({ role: 'GESTOR_GERAL' }),
  };

  let component: ContratoListComponent;

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      imports: [ContratoListComponent],
      providers: [
        { provide: ApiService, useValue: apiMock },
        { provide: MessageService, useValue: toastMock },
        { provide: AuthService, useValue: authMock },
      ],
    });

    component = TestBed.createComponent(ContratoListComponent).componentInstance;
  });

  it('calcula valor total real estimado com incidentes cobrados ao cliente', () => {
    component.devolucaoData.set({ valorTotal: 500 } as never);
    component.incidents.set([
      { tipo: 'AVARIA', descricao: 'Para-choque', valor: 120, cobradoCliente: true },
      { tipo: 'MULTA', descricao: 'Radar', valor: 80, cobradoCliente: false },
      { tipo: 'COMBUSTIVEL', descricao: 'Abastecimento', valor: 50, cobradoCliente: true },
    ]);

    expect(component.valorTotalRealEstimado()).toBe(670);
  });

  it('evita duplicidade ao anexar fotos na devolução', () => {
    component.onDevolucaoFotoUploaded('rental/inspections/a.jpg');
    component.onDevolucaoFotoUploaded('rental/inspections/a.jpg');
    component.onDevolucaoFotoUploaded('rental/inspections/b.jpg');

    expect(component.devolucaoFotos()).toEqual([
      'rental/inspections/a.jpg',
      'rental/inspections/b.jpg',
    ]);
  });

  it('envia incidentes e fotos no payload de fechamento', async () => {
    const loadSpy = vi.spyOn(component, 'load').mockResolvedValue(undefined);
    component.devolucaoId.set('contract-1');
    component.kmDevolucao.set(12250);
    component.combustivelChegada.set('1/2');
    component.checklist.set({ Lataria: true });
    component.devolucaoFotos.set(['rental/inspections/chegada-1.jpg']);
    component.incidents.set([
      { tipo: 'AVARIA', descricao: 'Risco na porta', valor: 200, cobradoCliente: true },
    ]);

    await component.onSubmitDevolucao();

    expect(apiMock.patch).toHaveBeenCalledWith('/rental/contracts/contract-1/close', {
      kmDevolucao: 12250,
      combustivelChegada: '1/2',
      checklist: { Lataria: true },
      fotos: ['rental/inspections/chegada-1.jpg'],
      incidents: [
        {
          tipo: 'AVARIA',
          descricao: 'Risco na porta',
          valor: 200,
          cobradoCliente: true,
        },
      ],
      observacoes: undefined,
    });
    expect(loadSpy).toHaveBeenCalled();
  });
});
