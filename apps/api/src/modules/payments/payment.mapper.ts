import type { Payment as PrismaPayment } from '@prisma/client';
import type { PaymentDTO } from '@rcar/shared-types';

/**
 * Backend seam (toDTO): maps an internal Prisma `Payment` row to the wire
 * {@link PaymentDTO} contract.
 *
 * This adapter is the single place that translates persistence concerns into the
 * API contract: `Decimal` becomes a JSON `number`, `Date` becomes an ISO-8601
 * string, and internal-only columns (`pagarmeTxId`, `masterAgreementId`,
 * `cicloReferencia`, `unidadeId`, `updatedAt`) are dropped. A DB column rename or
 * addition is absorbed here instead of leaking to the frontend.
 */
export function toPaymentDTO(payment: PrismaPayment): PaymentDTO {
  return {
    id: payment.id,
    refType: payment.refType,
    scheduleId: payment.scheduleId ?? undefined,
    queueId: payment.queueId ?? undefined,
    contractId: payment.contractId ?? undefined,
    customerId: payment.customerId ?? undefined,
    valor: Number(payment.valor),
    metodo: payment.metodo,
    status: payment.status,
    observacoes: payment.observacoes ?? undefined,
    createdAt:
      payment.createdAt instanceof Date
        ? payment.createdAt.toISOString()
        : String(payment.createdAt),
  };
}
