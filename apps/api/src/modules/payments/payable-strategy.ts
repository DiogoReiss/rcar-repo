import { PaymentRefType } from '@prisma/client';

/**
 * Normalized view of a payable resource, independent of its domain origin
 * (contract, wash schedule, wash queue, …). Produced by a {@link PayableStrategy}
 * and consumed by the PaymentsService to charge, sum and balance payments.
 */
export interface PayableInfo {
  valor: number;
  customerId: string | null;
  customerName: string | null;
  scheduleId?: string;
  queueId?: string;
  contractId?: string;
}

/**
 * Seam between the Pagamento module and each payable domain entity. Every domain
 * module (Contrato, Agendamento, Fila, …) implements one strategy per
 * {@link PaymentRefType} and registers it into the {@link PayableRegistry}. The
 * PaymentsService only ever talks to this interface, so adding a new payable is
 * one new file in one module — no changes to PaymentsService.
 */
export interface PayableStrategy {
  /** The reference type this strategy resolves. */
  readonly refType: PaymentRefType;

  /** Resolves the payable identified by `refId` into a {@link PayableInfo}. */
  resolve(refId: string): Promise<PayableInfo>;
}
