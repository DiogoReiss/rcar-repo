import { Prisma, StockMovement, Product } from '@prisma/client';
import { StockMovementType } from './stock-movement-calculator.js';

/** A single product line to debit for a completed atendimento. */
export interface DeductionLine {
  productId: string;
  quantidade: Prisma.Decimal.Value;
}

/** Fully-resolved movement ready to be written, with its precomputed effect. */
export interface PersistMovementInput {
  productId: string;
  tipo: StockMovementType;
  quantidade: Prisma.Decimal.Value;
  custoUnitario?: Prisma.Decimal.Value | null;
  motivo?: string;
  userId?: string;
  idempotencyKey?: string;
  novaQuantidade: Prisma.Decimal;
  novoCustoUnitario: Prisma.Decimal | null;
  /** When true the product's `custoUnitario` is updated (ENTRADA only). */
  atualizarCusto: boolean;
}

/**
 * Seam that isolates stock-movement persistence from the pure ADR-005
 * calculation. Both the manual `InventoryService.createMovement` path and the
 * automatic {@link DeductionLine} debit go through this interface, so the
 * calculator stays DB-free and the persistence is unit-swappable.
 */
export abstract class InventoryRepository {
  abstract findMovementByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<StockMovement | null>;
  abstract findProduct(id: string): Promise<Product | null>;
  abstract saveMovement(input: PersistMovementInput): Promise<StockMovement>;
  /**
   * Atomically debits every line for a completed atendimento in a single
   * transaction (D1), skipping any product that would go negative.
   */
  abstract deductForAtendimento(
    refId: string,
    lines: DeductionLine[],
  ): Promise<void>;
}
