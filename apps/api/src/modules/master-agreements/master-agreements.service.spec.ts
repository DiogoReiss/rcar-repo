import { MasterAgreementsService } from './master-agreements.service';

describe('MasterAgreementsService', () => {
  const audit = { record: jest.fn() };

  const makePrisma = (over: Record<string, unknown> = {}) => ({
    customer: { findUnique: jest.fn().mockResolvedValue({ id: 'cust1' }) },
    masterAgreement: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    masterAgreementItem: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    ...over,
  });

  beforeEach(() => jest.clearAllMocks());

  it('creates an agreement with items and audits it', async () => {
    const prisma = makePrisma();
    prisma.masterAgreement.create.mockResolvedValue({
      id: 'a1',
      items: [{ id: 'i1' }, { id: 'i2' }],
    });
    const service = new MasterAgreementsService(
      prisma as never,
      audit as never,
    );

    const result = await service.create(
      {
        customerId: 'cust1',
        ciclo: 'MENSAL',
        items: [
          { vehicleId: 'v1', valorCiclo: 1000 },
          { vehicleId: 'v2', valorCiclo: 800 },
        ],
      },
      { id: 'u1' },
    );

    expect(result.id).toBe('a1');
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ acao: 'MASTER_AGREEMENT_CREATED' }),
    );
  });

  it('unlink preserves history (soft close) instead of deleting', async () => {
    const prisma = makePrisma();
    prisma.masterAgreementItem.findFirst.mockResolvedValue({
      id: 'i1',
      agreementId: 'a1',
      ativo: true,
      vehicleId: 'v1',
    });
    prisma.masterAgreementItem.update.mockResolvedValue({
      id: 'i1',
      ativo: false,
    });
    const service = new MasterAgreementsService(
      prisma as never,
      audit as never,
    );

    await service.unlinkVehicle('a1', 'i1', { id: 'u1' });

    expect(prisma.masterAgreementItem.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ ativo: false }),
      }),
    );
  });

  it('apuracao is traceable per vehicle and per cycle', async () => {
    const prisma = makePrisma();
    prisma.masterAgreement.findUnique.mockResolvedValue({
      id: 'a1',
      ciclo: 'MENSAL',
      items: [
        { vehicleId: 'v1', ativo: true, valorCiclo: 1000 },
        { vehicleId: 'v2', ativo: true, valorCiclo: 800 },
        { vehicleId: 'v1', ativo: false, valorCiclo: 900 },
      ],
    });
    const service = new MasterAgreementsService(
      prisma as never,
      audit as never,
    );

    const result = await service.apuracao('a1');

    expect(result.valorCicloAtual).toBe(1800);
    expect(result.veiculosAtivos).toBe(2);
    const v1 = result.porVeiculo.find((v) => v.vehicleId === 'v1');
    expect(v1?.historico).toBe(1);
  });
});
