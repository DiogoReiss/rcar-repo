import { BillingService } from './billing.service';

describe('BillingService', () => {
  const audit = { record: jest.fn() };
  const notifications = { notify: jest.fn() };

  const makeGateway = () => ({
    createCharge: jest.fn().mockResolvedValue({
      externalId: 'ext-1',
      status: 'PENDING',
      boletoUrl: 'https://boleto/x',
    }),
    getStatus: jest.fn(),
    refund: jest.fn(),
  });

  const agreementBase = {
    id: 'aaaa1234-0000-4000-8000-000000000000',
    customerId: 'cust1',
    ciclo: 'MENSAL',
    status: 'ATIVO',
    diaVencimento: 10,
    proximoCiclo: new Date('2026-07-10T00:00:00Z'),
    customer: {
      id: 'cust1',
      nome: 'Cliente',
      email: 'c@x.com',
      telefone: null,
      canalPreferido: 'EMAIL',
    },
    items: [
      { ativo: true, valorCiclo: 1000, vehicleId: 'v1' },
      { ativo: true, valorCiclo: 800, vehicleId: 'v2' },
    ],
  };

  const makePrisma = (over: Record<string, unknown> = {}) => ({
    masterAgreement: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    payment: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
    },
    ...over,
  });

  const build = (prisma: ReturnType<typeof makePrisma>) =>
    new BillingService(
      prisma as never,
      audit as never,
      notifications as never,
      makeGateway(),
    );

  beforeEach(() => jest.clearAllMocks());

  describe('nextProximoCiclo', () => {
    it('advances weekly cycles by 7 days', () => {
      const service = build(makePrisma());
      const next = service.nextProximoCiclo(
        new Date('2026-07-01T00:00:00'),
        'SEMANAL',
      );
      expect(next.getDate()).toBe(8);
      expect(next.getMonth()).toBe(6); // July
    });

    it('advances monthly cycles honoring diaVencimento (clamped)', () => {
      const service = build(makePrisma());
      const next = service.nextProximoCiclo(
        new Date('2026-01-31T00:00:00'),
        'MENSAL',
        31,
      );
      // February has no 31st → clamped to 28 (2026 not leap)
      expect(next.getMonth()).toBe(1); // February
      expect(next.getDate()).toBe(28);
    });
  });

  it('generates a consolidated charge for the sum of active items and audits', async () => {
    const prisma = makePrisma();
    prisma.masterAgreement.findUnique.mockResolvedValue(agreementBase);
    prisma.payment.create.mockResolvedValue({
      id: 'pay1',
      valor: 1800,
    });
    const service = build(prisma);

    const result = await service.generateInvoice(
      agreementBase.id,
      new Date('2026-07-10T00:00:00Z'),
      { id: 'u1' },
    );

    expect(result.created).toBe(true);
    expect(prisma.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          refType: 'MASTER_AGREEMENT',
          masterAgreementId: agreementBase.id,
        }),
      }),
    );
    // amount = 1000 + 800
    const created = prisma.payment.create.mock.calls[0][0].data;
    expect(Number(created.valor)).toBe(1800);
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        acao: 'MASTER_AGREEMENT_INVOICE_GENERATED',
      }),
    );
    expect(notifications.notify).toHaveBeenCalledTimes(1);
  });

  it('is idempotent: an existing payment for the cycle is not re-billed', async () => {
    const prisma = makePrisma();
    prisma.masterAgreement.findUnique.mockResolvedValue(agreementBase);
    prisma.payment.findFirst.mockResolvedValue({ id: 'existing' });
    const service = build(prisma);

    const result = await service.generateInvoice(
      agreementBase.id,
      new Date('2026-07-10T00:00:00Z'),
    );

    expect(result.created).toBe(false);
    expect(prisma.payment.create).not.toHaveBeenCalled();
    expect(notifications.notify).not.toHaveBeenCalled();
  });

  it('skips agreements with no active items', async () => {
    const prisma = makePrisma();
    prisma.masterAgreement.findUnique.mockResolvedValue({
      ...agreementBase,
      items: [],
    });
    const service = build(prisma);

    const result = await service.generateInvoice(
      agreementBase.id,
      new Date('2026-07-10T00:00:00Z'),
    );

    expect(result.created).toBe(false);
    expect(result.skipped).toBe('sem-itens-ativos');
    expect(prisma.payment.create).not.toHaveBeenCalled();
  });

  it('runCycle bills every due agreement and advances proximoCiclo', async () => {
    const prisma = makePrisma();
    prisma.masterAgreement.findMany.mockResolvedValue([
      {
        id: agreementBase.id,
        ciclo: 'MENSAL',
        diaVencimento: 10,
        proximoCiclo: new Date('2026-07-10T00:00:00Z'),
      },
    ]);
    prisma.masterAgreement.findUnique.mockResolvedValue(agreementBase);
    prisma.payment.create.mockResolvedValue({ id: 'pay1', valor: 1800 });
    const service = build(prisma);

    const summary = await service.runCycle(new Date('2026-07-15T00:00:00Z'));

    expect(summary.processados).toBe(1);
    expect(summary.faturas).toBe(1);
    expect(summary.totalValor).toBe(1800);
    expect(prisma.masterAgreement.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ proximoCiclo: expect.any(Date) }),
      }),
    );
  });
});
