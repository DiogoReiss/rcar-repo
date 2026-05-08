import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { InventoryService } from './inventory.service';

describe('InventoryService', () => {
  const prisma = {
    product: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    stockMovement: {
      findFirst: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    $queryRaw: jest.fn(),
    $transaction: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('throws when product is not found', async () => {
    prisma.product.findUnique.mockResolvedValue(null);
    const service = new InventoryService(prisma as never);

    await expect(service.findProductById('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('blocks stock output when quantity is insufficient', async () => {
    prisma.stockMovement.findFirst.mockResolvedValue(null);
    prisma.product.findUnique.mockResolvedValue({
      id: 'prod-1',
      quantidadeAtual: new Prisma.Decimal(1),
      custoUnitario: new Prisma.Decimal(2),
    });
    const service = new InventoryService(prisma as never);

    await expect(
      service.createMovement(
        { productId: 'prod-1', tipo: 'SAIDA', quantidade: 2 },
        'user-1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
