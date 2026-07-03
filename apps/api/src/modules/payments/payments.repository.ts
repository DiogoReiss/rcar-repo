import {
  Payment,
  PaymentMethod,
  PaymentRefType,
  PaymentStatus,
  Prisma,
} from '@prisma/client';

/** Identifies which payable a Payment row belongs to (exactly one is set). */
export interface PayableRef {
  contractId?: string;
  scheduleId?: string;
  queueId?: string;
}

/** Data for a PENDENTE online charge created through the gateway. */
export interface CreatePendingPaymentData {
  refType: PaymentRefType;
  contractId: string | null;
  scheduleId: string | null;
  queueId: string | null;
  customerId: string | null;
  valor: Prisma.Decimal.Value;
  metodo: PaymentMethod;
  pagarmeTxId: string;
}

/** Filter for the paginated payment listing. */
export interface PaymentListFilter {
  refType?: PaymentRefType;
  status?: PaymentStatus;
  metodo?: PaymentMethod;
  from?: string;
  to?: string;
}

/** Filter for the payment-method aggregation. */
export interface MethodSummaryFilter {
  refType?: PaymentRefType;
  status?: PaymentStatus;
  from?: string;
  to?: string;
}

const paymentContactInclude = {
  customer: { select: { nome: true, email: true, telefone: true } },
} satisfies Prisma.PaymentInclude;

const paymentCustomerDocInclude = {
  customer: { select: { nome: true, cpfCnpj: true } },
} satisfies Prisma.PaymentInclude;

const paymentCustomerRefInclude = {
  customer: { select: { id: true, nome: true, cpfCnpj: true } },
} satisfies Prisma.PaymentInclude;

export type PaymentWithContact = Prisma.PaymentGetPayload<{
  include: typeof paymentContactInclude;
}>;
export type PaymentWithCustomerDoc = Prisma.PaymentGetPayload<{
  include: typeof paymentCustomerDocInclude;
}>;
export type PaymentWithCustomerRef = Prisma.PaymentGetPayload<{
  include: typeof paymentCustomerRefInclude;
}>;

/** A single (metodo, valor) row used to build the method summary. */
export type PaymentAmount = { metodo: PaymentMethod; valor: Prisma.Decimal };

export const PAYMENT_INCLUDES = {
  contact: paymentContactInclude,
  customerDoc: paymentCustomerDocInclude,
  customerRef: paymentCustomerRefInclude,
};

/**
 * Seam that centralizes every Prisma access for the Pagamento module — Payment
 * rows and the webhook idempotency ledger. The {@link PaymentsService}
 * orchestrates the gateway port, balance math, HMAC verification and receipt
 * emails, and talks only to this interface, so the storage adapter can be
 * swapped for an in-memory fake in tests and the service stays free of
 * scattered `prisma.*` calls, `.include()` chains and where-builders.
 */
export abstract class PaymentsRepository {
  /** Confirmed amount already paid for a payable. */
  abstract sumConfirmed(ref: PayableRef): Promise<number>;

  /** The open PENDENTE charge for a payable + refType, if any (idempotency). */
  abstract findPendingPayment(
    refType: PaymentRefType,
    ref: PayableRef,
  ): Promise<Payment | null>;

  abstract createPendingPayment(
    data: CreatePendingPaymentData,
  ): Promise<Payment>;

  abstract findPaymentById(id: string): Promise<Payment | null>;
  abstract updatePaymentStatus(
    id: string,
    status: PaymentStatus,
  ): Promise<Payment>;

  /**
   * Records an inbound webhook in the idempotency ledger. Resolves `true` when
   * the event was newly recorded and `false` when it is a duplicate.
   */
  abstract recordWebhookEvent(
    source: string,
    eventId: string,
    status: string,
    detalhes: Prisma.InputJsonValue,
  ): Promise<boolean>;

  abstract findPaymentByTxId(
    externalId: string,
  ): Promise<PaymentWithContact | null>;
  abstract findPaymentReceipt(
    id: string,
  ): Promise<PaymentWithCustomerDoc | null>;

  abstract listPayments(
    filter: PaymentListFilter,
    skip: number,
    take: number,
  ): Promise<{ data: Payment[]; total: number }>;

  abstract listPaymentAmounts(
    filter: MethodSummaryFilter,
  ): Promise<PaymentAmount[]>;

  abstract listPendingBefore(
    threshold: Date,
  ): Promise<PaymentWithCustomerRef[]>;
}
