import { ConflictException, NotFoundException } from '@nestjs/common';
import { FleetService } from './fleet.service';

describe('FleetService', () => {
  const prisma = {
    vehicle: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    vehicleMaintenance: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns paginated vehicles filtered by status and deletedAt', async () => {
    prisma.vehicle.findMany.mockResolvedValue([{ id: 'v1', placa: 'ABC-1234' }]);
    prisma.vehicle.count.mockResolvedValue(1);
    const service = new FleetService(prisma as never);

    const result = await service.findAll('DISPONIVEL' as never, { page: 2, perPage: 5 });

    expect(prisma.vehicle.findMany).toHaveBeenCalledWith({
      where: { deletedAt: null, status: 'DISPONIVEL' },
      orderBy: { modelo: 'asc' },
      skip: 5,
      take: 5,
    });
    expect(result.total).toBe(1);
    expect(result.totalPages).toBe(1);
  });

  it('throws conflict when plate already exists on create', async () => {
    prisma.vehicle.findUnique.mockResolvedValue({ id: 'existing' });
    const service = new FleetService(prisma as never);

    await expect(
      service.create({ placa: 'ABC-1234', modelo: 'Onix', ano: 2020, cor: 'Branco', categoria: 'ECONOMICO' } as never),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws not found when findOne misses vehicle', async () => {
    prisma.vehicle.findUnique.mockResolvedValue(null);
    const service = new FleetService(prisma as never);

    await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('adds maintenance and sets status to MANUTENCAO when requested', async () => {
    prisma.vehicle.findUnique.mockResolvedValue({ id: 'v1', status: 'DISPONIVEL' });
    prisma.vehicleMaintenance.create.mockResolvedValue({ id: 'm1', descricao: 'Troca de óleo' });
    prisma.vehicle.update.mockResolvedValue({ id: 'v1', status: 'MANUTENCAO' });
    prisma.$transaction.mockResolvedValue([{ id: 'm1', descricao: 'Troca de óleo' }, { id: 'v1', status: 'MANUTENCAO' }]);

    const service = new FleetService(prisma as never);

    const result = await service.addMaintenance('v1', {
      descricao: 'Troca de óleo',
      custo: 100,
      data: '2026-05-08T12:00:00.000Z',
      setMantencao: true,
    });

    expect(prisma.vehicleMaintenance.create).toHaveBeenCalled();
    expect(prisma.vehicle.update).toHaveBeenCalledWith({ where: { id: 'v1' }, data: { status: 'MANUTENCAO' } });
    expect(result).toEqual({ id: 'm1', descricao: 'Troca de óleo' });
  });
});

