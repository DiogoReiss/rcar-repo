import { BadRequestException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { FakePaymentGateway } from './fake-payment.gateway';

describe('PaymentsService.startCharge', () => {
  const contract = {
    id: 'c1',
    customerId: 'cust1',
    valorTotal: 300,
    valorTotalReal: null,
    customer: { id: 'cust1', nome: 'Cliente' },
  };

  const makePrisma = (over: Record<string, unknown> = {}) => ({
    rentalContract: { findUnique: jest.fn().mockResolvedValue(contract) },
    payment: {
      findFirst: jest.fn().mockResolvedValue(null),
      aggregate: jest.fn().mockResolvedValue({ _sum: { valor: 0 } }),
      create: jest
        .fn()
        .mockImplementation(({ data }: never) =>
          Promise.resolve({ id: 'pay1', ...(data as object) }),
        ),
    },
    ...over,
  });

  const audit = { record: jest.fn() };

  beforeEach(() => jest.clearAllMocks());

  it('creates a PENDENTE payment with external tx id (Pix happy path)', async () => {
    const prisma = makePrisma();
    const service = new PaymentsService(
      prisma as never,
      audit as never,
      { notify: jest.fn() } as never,
      { get: (_k: string, def: string) => def } as never,
      new FakePaymentGateway(),
    );

    const result = await service.startCharge({
      refType: 'RENTAL_CONTRACT',
      refId: 'c1',
      metodo: 'PIX',
    });

    expect(result.status).toBe('PENDENTE');
    expect(result.pagarmeTxId).toMatch(/^fake-pix-/);
    expect((result as { pixQrCode?: string }).pixQrCode).toBeDefined();
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ acao: 'PAYMENT_CHARGE_STARTED' }),
    );
  });

  it('is idempotent — returns existing PENDENTE payment', async () => {
    const prisma = makePrisma();
    prisma.payment.findFirst.mockResolvedValue({
      id: 'existing',
      status: 'PENDENTE',
    });
    const service = new PaymentsService(
      prisma as never,
      audit as never,
      { notify: jest.fn() } as never,
      { get: (_k: string, def: string) => def } as never,
      new FakePaymentGateway(),
    );

    const result = await service.startCharge({
      refType: 'RENTAL_CONTRACT',
      refId: 'c1',
    });

    expect(result).toEqual({ id: 'existing', status: 'PENDENTE' });
    expect(prisma.payment.create).not.toHaveBeenCalled();
  });

  it('surfaces a clear error when the gateway refuses the charge', async () => {
    const refused = {
      ...contract,
      customer: { id: 'cust1', nome: 'Cliente Recusa' },
    };
    const prisma = makePrisma({
      rentalContract: { findUnique: jest.fn().mockResolvedValue(refused) },
    });
    const service = new PaymentsService(
      prisma as never,
      audit as never,
      { notify: jest.fn() } as never,
      { get: (_k: string, def: string) => def } as never,
      new FakePaymentGateway(),
    );

    await expect(
      service.startCharge({ refType: 'RENTAL_CONTRACT', refId: 'c1' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.payment.create).not.toHaveBeenCalled();
  });
});
