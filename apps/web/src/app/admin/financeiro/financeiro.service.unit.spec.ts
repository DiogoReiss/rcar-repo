import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { FinanceiroService } from './financeiro.service';
import { ApiService } from '../../core/services/api.service';

describe('FinanceiroService', () => {
  let service: FinanceiroService;
  const apiMock = {
    get: vi.fn(),
  } as unknown as ApiService;

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        FinanceiroService,
        { provide: ApiService, useValue: apiMock },
      ],
    });
    service = TestBed.inject(FinanceiroService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('load() should populate all finance signals', async () => {
    (apiMock.get as any)
      .mockReturnValueOnce(of({ periodo: { from: '2026-05-01', to: '2026-05-31' }, receita: { lavajato: 100, aluguel: 200, extrasAluguel: 20, total: 320 }, custos: { insumos: 30, manutencao: 40, total: 70 }, margem: { bruta: 250, percentual: 78 } }))
      .mockReturnValueOnce(of({ totalRegistros: 1, totalFaturado: 500, totalPago: 400, totalPendente: 100, aging: { vencidos: 50, aVencer: 50 }, data: [] }))
      .mockReturnValueOnce(of({ periodo: { from: '2026-05-01', to: '2026-05-31' }, totalCusto: 90, totalReceita: 180, totalLucroBruto: 90, manutencoes: 2, veiculos: [] }))
      .mockReturnValueOnce(of({ periodo: { from: '2026-05-01', to: '2026-05-31' }, custoTotal: 120, itens: 3, valorEstoqueAtual: 900, produtos: [] }))
      .mockReturnValueOnce(of({ totalValor: 1000, totalQuantidade: 10, data: [] }));

    await service.load('2026-05-01', '2026-05-31');

    expect(apiMock.get).toHaveBeenCalledTimes(5);
    expect(service.summary()).toBeTruthy();
    expect(service.receivables()).toBeTruthy();
    expect(service.maintenance()).toBeTruthy();
    expect(service.stockCosts()).toBeTruthy();
    expect(service.paymentMethods()).toBeTruthy();
    expect(service.error()).toBeNull();
  });
});


