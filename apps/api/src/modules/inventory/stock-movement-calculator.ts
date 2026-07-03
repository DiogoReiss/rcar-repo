import { Prisma, StockMovementType } from '@prisma/client';

export type { StockMovementType };

/** Current cost-bearing state of a product, independent of persistence. */
export interface ProductCostState {
  quantidadeAtual: Prisma.Decimal;
  custoUnitario: Prisma.Decimal | null;
}

export interface StockMovementInput {
  tipo: StockMovementType;
  quantidade: Prisma.Decimal.Value;
  custoUnitario?: Prisma.Decimal.Value | null;
}

export interface StockMovementResult {
  novaQuantidade: Prisma.Decimal;
  novoCustoUnitario: Prisma.Decimal | null;
}

/**
 * ADR-005 — pure computation of a stock movement's effect on a product.
 *
 * - ENTRADA recalculates the unit cost by weighted average when a movement cost
 *   is supplied: `((qtyAtual * custoAtual) + (qtyEntrada * custoEntrada)) / qtyFinal`.
 * - SAIDA / AJUSTE keep the current cost.
 *
 * It never touches the database and applies no negative-stock policy — callers
 * decide whether a resulting negative `novaQuantidade` is an error (manual
 * movement) or a skip (automatic atendimento debit).
 */
export function calculateStockMovement(
  current: ProductCostState,
  input: StockMovementInput,
): StockMovementResult {
  const currentQty = new Prisma.Decimal(current.quantidadeAtual);
  const movQty = new Prisma.Decimal(input.quantidade);

  switch (input.tipo) {
    case 'ENTRADA': {
      const novaQuantidade = currentQty.add(movQty);
      let novoCustoUnitario = current.custoUnitario;
      if (input.custoUnitario !== undefined && input.custoUnitario !== null) {
        const custoEntrada = new Prisma.Decimal(input.custoUnitario);
        const custoAtual = current.custoUnitario ?? new Prisma.Decimal(0);
        const valorAtual = currentQty.mul(custoAtual);
        const valorEntrada = movQty.mul(custoEntrada);
        novoCustoUnitario = novaQuantidade.greaterThan(0)
          ? valorAtual.add(valorEntrada).div(novaQuantidade)
          : custoEntrada;
      }
      return { novaQuantidade, novoCustoUnitario };
    }
    case 'SAIDA':
      return {
        novaQuantidade: currentQty.sub(movQty),
        novoCustoUnitario: current.custoUnitario,
      };
    case 'AJUSTE':
      return {
        novaQuantidade: movQty,
        novoCustoUnitario: current.custoUnitario,
      };
    default: {
      const exhaustive: never = input.tipo;
      throw new Error(`Tipo de movimentação inválido: ${String(exhaustive)}`);
    }
  }
}
