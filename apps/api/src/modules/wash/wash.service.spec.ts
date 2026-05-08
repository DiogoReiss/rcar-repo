import { NotFoundException } from '@nestjs/common';
import { WashService } from './wash.service';

describe('WashService', () => {
  const prisma = {
    washService: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(() => jest.clearAllMocks());

  it('returns paginated active services by default', async () => {
    prisma.washService.findMany.mockResolvedValue([{ id: 's1', nome: 'Lavagem' }]);
    prisma.washService.count.mockResolvedValue(1);
    const service = new WashService(prisma as never);

    const result = await service.findAll(false, { page: 2, perPage: 10 });

    expect(prisma.washService.findMany).toHaveBeenCalledWith({
      where: { ativo: true },
      orderBy: { nome: 'asc' },
      skip: 10,
      take: 10,
    });
    expect(result.totalPages).toBe(1);
  });

  it('throws when service is not found', async () => {
    prisma.washService.findUnique.mockResolvedValue(null);
    const service = new WashService(prisma as never);

    await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});

