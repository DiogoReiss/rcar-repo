import { OperationalUnitsService } from './operational-units.service';

describe('OperationalUnitsService', () => {
  const prisma = {
    operationalUnit: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };
  const audit = { record: jest.fn() };

  const service = new OperationalUnitsService(prisma as never, audit as never);

  beforeEach(() => jest.clearAllMocks());

  it('lists all units for a GESTOR_GERAL', async () => {
    prisma.operationalUnit.findMany.mockResolvedValue([]);

    await service.findAll({ role: 'GESTOR_GERAL', unidadeId: null });

    expect(prisma.operationalUnit.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { deletedAt: null } }),
    );
  });

  it('restricts listing to the scoped unit for an OPERADOR', async () => {
    prisma.operationalUnit.findMany.mockResolvedValue([]);

    await service.findAll({ role: 'OPERADOR', unidadeId: 'unit-a' });

    expect(prisma.operationalUnit.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'unit-a', deletedAt: null } }),
    );
  });

  it('creates a unit and records an audit entry', async () => {
    prisma.operationalUnit.create.mockResolvedValue({
      id: 'u1',
      codigo: 'SP01',
    });

    const result = await service.create(
      { nome: 'São Paulo Centro', codigo: 'SP01' },
      { id: 'admin', role: 'GESTOR_GERAL' },
    );

    expect(result.id).toBe('u1');
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ acao: 'OPERATIONAL_UNIT_CREATED' }),
    );
  });
});
