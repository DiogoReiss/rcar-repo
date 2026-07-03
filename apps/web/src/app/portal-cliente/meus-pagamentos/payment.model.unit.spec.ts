import { describe, it, expect } from 'vitest';
import type { PaymentDTO } from '@rcar/shared-types';
import { fromPaymentDTO } from './payment.model';

describe('fromPaymentDTO', () => {
  const dto: PaymentDTO = {
    id: 'pay-1',
    refType: 'RENTAL_CONTRACT',
    contractId: 'rc-1',
    customerId: 'cust-1',
    valor: 900.5,
    metodo: 'PIX',
    status: 'CONFIRMADO',
    createdAt: '2026-06-01T10:00:00.000Z',
  };

  it('parses the wire ISO string into a Date', () => {
    const payment = fromPaymentDTO(dto);
    expect(payment.createdAt).toBeInstanceOf(Date);
    expect(payment.createdAt.toISOString()).toBe('2026-06-01T10:00:00.000Z');
  });

  it('carries the contract fields through unchanged', () => {
    const payment = fromPaymentDTO(dto);
    expect(payment.id).toBe('pay-1');
    expect(payment.valor).toBe(900.5);
    expect(payment.metodo).toBe('PIX');
    expect(payment.status).toBe('CONFIRMADO');
    expect(payment.contractId).toBe('rc-1');
  });
});
