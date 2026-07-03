import { Injectable } from '@nestjs/common';
import { Prisma, Product, StockMovement } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  DeductionLine,
  InventoryRepository,
  PersistMovementInput,
} from './inventory.repository.js';
import { calculateStockMovement } from './stock-movement-calculator.js';

/**
 * Prisma-backed {@link InventoryRepository}. Owns every StockMovement / Product
 * write on the movement path, including the atomic auto-debit transaction for a
 * completed atendimento.
 */
@Injectable()
export class PrismaInventoryRepository extends InventoryRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  findMovementByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<StockMovement | null> {
    return this.prisma.stockMovement.findFirst({
      where: { idempotencyKey },
    });
  }

  findProduct(id: string): Promise<Product | null> {
    return this.prisma.product.findUnique({ where: { id } });
  }

  async saveMovement(input: PersistMovementInput): Promise<StockMovement> {
    const data: Prisma.StockMovementUncheckedCreateInput = {
      productId: input.productId,
      tipo: input.tipo,
      quantidade: input.quantidade,
      custoUnitario: input.custoUnitario ?? undefined,
      motivo: input.motivo,
      userId: input.userId,
    };
    if (input.idempotencyKey) {
      (data as { idempotencyKey?: string }).idempotencyKey =
        input.idempotencyKey;
    }

    const [movement] = await this.prisma.$transaction([
      this.prisma.stockMovement.create({ data }),
      this.prisma.product.update({
        where: { id: input.productId },
        data: {
          quantidadeAtual: input.novaQuantidade,
          ...(input.atualizarCusto
            ? { custoUnitario: input.novoCustoUnitario }
            : {}),
        },
      }),
    ]);
    return movement;
  }

  async deductForAtendimento(
    refId: string,
    lines: DeductionLine[],
  ): Promise<void> {
    if (!lines.length) return;

    // D1: single transaction across all products to prevent partial debits.
    await this.prisma.$transaction(async (tx) => {
      for (const line of lines) {
        const current = await tx.product.findUnique({
          where: { id: line.productId },
          select: { quantidadeAtual: true, custoUnitario: true },
        });
        if (!current) continue;

        const { novaQuantidade } = calculateStockMovement(current, {
          tipo: 'SAIDA',
          quantidade: line.quantidade,
        });
        if (novaQuantidade.lessThan(0)) continue; // don't go negative

        await tx.stockMovement.create({
          data: {
            productId: line.productId,
            tipo: 'SAIDA',
            quantidade: new Prisma.Decimal(line.quantidade),
            motivo: `Saída automática — atendimento ${refId}`,
          },
        });
        await tx.product.update({
          where: { id: line.productId },
          data: { quantidadeAtual: novaQuantidade },
        });
      }
    });
  }
}
