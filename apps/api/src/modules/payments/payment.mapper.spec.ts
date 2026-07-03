import { Prisma, type Payment as PrismaPayment } from '@prisma/client';
import { toPaymentDTO } from './payment.mapper';

describe('toPaymentDTO', () => {
  const base: PrismaPayment = {
    id: 'pay-1',
    refType: 'RENTAL_CONTRACT',
    scheduleId: null,
    queueId: null,
    contractId: 'rc-1',
    masterAgreementId: null,
    cicloReferencia: null,
    customerId: 'cust-1',
    valor: new Prisma.Decimal('900.50'),
    metodo: 'PIX',
    status: 'CONFIRMADO',
    pagarmeTxId: 'fake-pix-123',
    observacoes: null,
    unidadeId: 'unit-1',
    createdAt: new Date('2026-06-01T10:00:00.000Z'),
    updatedAt: new Date('2026-06-02T10:00:00.000Z'),
  };

  it('converts Decimal valor to a JSON number and Date to an ISO string', () => {
    const dto = toPaymentDTO(base);
    expect(dto.valor).toBe(900.5);
    expect(typeof dto.valor).toBe('number');
    expect(dto.createdAt).toBe('2026-06-01T10:00:00.000Z');
  });

  it('drops internal-only columns from the contract', () => {
    const dto = toPaymentDTO(base) as Record<string, unknown>;
    expect(dto['pagarmeTxId']).toBeUndefined();
    expect(dto['masterAgreementId']).toBeUndefined();
    expect(dto['cicloReferencia']).toBeUndefined();
    expect(dto['unidadeId']).toBeUndefined();
    expect(dto['updatedAt']).toBeUndefined();
    expect(Object.keys(dto).sort()).toEqual(
      [
        'contractId',
        'createdAt',
        'customerId',
        'id',
        'metodo',
        'observacoes',
        'queueId',
        'refType',
        'scheduleId',
        'status',
        'valor',
      ].sort(),
    );
  });

  it('normalises nullable columns to undefined', () => {
    const dto = toPaymentDTO(base);
    expect(dto.scheduleId).toBeUndefined();
    expect(dto.queueId).toBeUndefined();
    expect(dto.observacoes).toBeUndefined();
    expect(dto.contractId).toBe('rc-1');
  });
});
