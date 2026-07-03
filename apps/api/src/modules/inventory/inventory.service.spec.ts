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

  const repo = {
    findMovementByIdempotencyKey: jest.fn(),
    findProduct: jest.fn(),
    saveMovement: jest.fn(),
    deductForAtendimento: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('throws when product is not found', async () => {
    prisma.product.findUnique.mockResolvedValue(null);
    const service = new InventoryService(prisma as never, repo);

    await expect(service.findProductById('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('blocks stock output when quantity is insufficient', async () => {
    repo.findProduct.mockResolvedValue({
      id: 'prod-1',
      quantidadeAtual: new Prisma.Decimal(1),
      custoUnitario: new Prisma.Decimal(2),
    });
    const service = new InventoryService(prisma as never, repo);

    await expect(
      service.createMovement(
        { productId: 'prod-1', tipo: 'SAIDA', quantidade: 2 } as never,
        'user-1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.saveMovement).not.toHaveBeenCalled();
  });

  it('persists a movement with the calculated effect on a valid output', async () => {
    repo.findProduct.mockResolvedValue({
      id: 'prod-1',
      quantidadeAtual: new Prisma.Decimal(10),
      custoUnitario: new Prisma.Decimal(2),
    });
    repo.saveMovement.mockResolvedValue({ id: 'mov-1' });
    const service = new InventoryService(prisma as never, repo);

    const result = await service.createMovement({
      productId: 'prod-1',
      tipo: 'SAIDA',
      quantidade: 3,
    } as never);

    expect(result).toEqual({ id: 'mov-1' });
    const arg = repo.saveMovement.mock.calls[0][0];
    expect(arg.novaQuantidade.toString()).toBe('7');
    expect(arg.atualizarCusto).toBe(false);
  });
});
