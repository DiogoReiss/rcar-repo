import { ConflictException, NotFoundException } from '@nestjs/common';
import { CustomersService } from './customers.service';

describe('CustomersService', () => {
  const prisma = {
    customer: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns paginated customers with active+not deleted filter', async () => {
    prisma.customer.findMany.mockResolvedValue([
      { id: 'c1', nome: 'Cliente A' },
    ]);
    prisma.customer.count.mockResolvedValue(1);
    const service = new CustomersService(prisma as never);

    const result = await service.findAll('cli', { page: 2, perPage: 10 });

    expect(prisma.customer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          ativo: true,
          deletedAt: null,
          OR: [
            { nome: { contains: 'cli', mode: 'insensitive' } },
            { cpfCnpj: { contains: 'cli' } },
            { email: { contains: 'cli', mode: 'insensitive' } },
          ],
        },
        skip: 10,
        take: 10,
      }),
    );
    expect(result).toEqual({
      data: [{ id: 'c1', nome: 'Cliente A' }],
      total: 1,
      page: 2,
      perPage: 10,
      totalPages: 1,
    });
  });

  it('throws not found when findOne misses record', async () => {
    prisma.customer.findUnique.mockResolvedValue(null);
    const service = new CustomersService(prisma as never);

    await expect(service.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('throws conflict when cpfCnpj already exists', async () => {
    prisma.customer.findUnique.mockResolvedValue({ id: 'existing' });
    const service = new CustomersService(prisma as never);

    await expect(
      service.create({ tipo: 'PF', nome: 'Maria', cpfCnpj: '123' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
