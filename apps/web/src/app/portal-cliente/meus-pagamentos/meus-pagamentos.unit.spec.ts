import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MessageService } from 'primeng/api';
import { ApiService } from '@core/services/api.service';
import MeusPagamentosComponent from './meus-pagamentos';

describe('MeusPagamentosComponent', () => {
  const payments = [
    { id: 'p1', refType: 'RENTAL_CONTRACT', valor: 900, metodo: 'PIX', status: 'CONFIRMADO', createdAt: '2026-06-01T10:00:00Z' },
    { id: 'p2', refType: 'WASH_SCHEDULE', valor: 60, metodo: 'CARTAO_CREDITO', status: 'CONFIRMADO', createdAt: '2026-06-03T10:00:00Z' },
    { id: 'p3', refType: 'RENTAL_CONTRACT', valor: 450, metodo: 'BOLETO', status: 'PENDENTE', createdAt: '2026-06-05T10:00:00Z' },
  ];

  const apiMock = { get: vi.fn(() => of(payments)) };
  const toastMock = { add: vi.fn() };

  let component: MeusPagamentosComponent;

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      imports: [MeusPagamentosComponent],
      providers: [
        { provide: ApiService, useValue: apiMock },
        { provide: MessageService, useValue: toastMock },
      ],
    });
    component = TestBed.createComponent(MeusPagamentosComponent).componentInstance;
  });

  it('loads payments and clears loading', () => {
    expect(apiMock.get).toHaveBeenCalledWith('/portal/my-payments');
    expect(component.payments()).toHaveLength(3);
    expect(component.loading()).toBe(false);
  });

  it('sums confirmed and pending totals separately', () => {
    expect(component.totalPago()).toBe(960);
    expect(component.totalPendente()).toBe(450);
  });

  it('emits a comprovante toast only for confirmed payments', () => {
    component.baixarComprovante(payments[2] as never);
    expect(toastMock.add).not.toHaveBeenCalled();

    component.baixarComprovante(payments[0] as never);
    expect(toastMock.add).toHaveBeenCalledTimes(1);
  });

  it('maps status to a badge modifier', () => {
    expect(component.badgeModifier('CONFIRMADO')).toBe('operador');
    expect(component.badgeModifier('CANCELADO')).toBe('inactive');
    expect(component.badgeModifier('PENDENTE')).toBe('warning');
  });
});
