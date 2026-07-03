import { Injectable } from '@nestjs/common';
import { Payment, PaymentRefType, PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  CreatePendingPaymentData,
  MethodSummaryFilter,
  PayableRef,
  PaymentAmount,
  PAYMENT_INCLUDES,
  PaymentListFilter,
  PaymentWithContact,
  PaymentWithCustomerDoc,
  PaymentWithCustomerRef,
  PaymentsRepository,
} from './payments.repository.js';

/**
 * Prisma-backed {@link PaymentsRepository}. Owns all Payment / WebhookEvent
 * persistence for the Pagamento module, including the where-builders for the
 * payable filter and the reporting period.
 */
@Injectable()
export class PrismaPaymentsRepository extends PaymentsRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  private payableWhere(ref: PayableRef): Prisma.PaymentWhereInput {
    return {
      ...(ref.contractId ? { contractId: ref.contractId } : {}),
      ...(ref.scheduleId ? { scheduleId: ref.scheduleId } : {}),
      ...(ref.queueId ? { queueId: ref.queueId } : {}),
    };
  }

  private periodWhere(
    from?: string,
    to?: string,
  ): Prisma.DateTimeFilter | undefined {
    if (!from && !to) return undefined;
    const dateFrom = from ? new Date(from) : new Date('1970-01-01');
    const dateTo = to ? new Date(to) : new Date();
    dateFrom.setHours(0, 0, 0, 0);
    dateTo.setHours(23, 59, 59, 999);
    return { gte: dateFrom, lte: dateTo };
  }

  async sumConfirmed(ref: PayableRef): Promise<number> {
    const agg = await this.prisma.payment.aggregate({
      where: { status: 'CONFIRMADO', ...this.payableWhere(ref) },
      _sum: { valor: true },
    });
    return Number(agg._sum.valor ?? 0);
  }

  findPendingPayment(
    refType: PaymentRefType,
    ref: PayableRef,
  ): Promise<Payment | null> {
    return this.prisma.payment.findFirst({
      where: { refType, status: 'PENDENTE', ...this.payableWhere(ref) },
    });
  }

  createPendingPayment(data: CreatePendingPaymentData): Promise<Payment> {
    return this.prisma.payment.create({
      data: {
        refType: data.refType,
        contractId: data.contractId,
        scheduleId: data.scheduleId,
        queueId: data.queueId,
        customerId: data.customerId,
        valor: data.valor,
        metodo: data.metodo,
        status: 'PENDENTE',
        pagarmeTxId: data.pagarmeTxId,
      },
    });
  }

  findPaymentById(id: string): Promise<Payment | null> {
    return this.prisma.payment.findUnique({ where: { id } });
  }

  updatePaymentStatus(id: string, status: PaymentStatus): Promise<Payment> {
    return this.prisma.payment.update({ where: { id }, data: { status } });
  }

  async recordWebhookEvent(
    source: string,
    eventId: string,
    status: string,
    detalhes: Prisma.InputJsonValue,
  ): Promise<boolean> {
    try {
      await this.prisma.webhookEvent.create({
        data: { source, eventId, status, detalhes },
      });
      return true;
    } catch {
      return false;
    }
  }

  findPaymentByTxId(externalId: string): Promise<PaymentWithContact | null> {
    return this.prisma.payment.findFirst({
      where: { pagarmeTxId: externalId },
      include: PAYMENT_INCLUDES.contact,
    });
  }

  findPaymentReceipt(id: string): Promise<PaymentWithCustomerDoc | null> {
    return this.prisma.payment.findUnique({
      where: { id },
      include: PAYMENT_INCLUDES.customerDoc,
    });
  }

  async listPayments(
    filter: PaymentListFilter,
    skip: number,
    take: number,
  ): Promise<{ data: Payment[]; total: number }> {
    const where: Prisma.PaymentWhereInput = {
      ...(filter.refType ? { refType: filter.refType } : {}),
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.metodo ? { metodo: filter.metodo } : {}),
      ...(this.periodWhere(filter.from, filter.to)
        ? { createdAt: this.periodWhere(filter.from, filter.to) }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.payment.count({ where }),
    ]);
    return { data, total };
  }

  listPaymentAmounts(filter: MethodSummaryFilter): Promise<PaymentAmount[]> {
    const where: Prisma.PaymentWhereInput = {
      ...(filter.refType ? { refType: filter.refType } : {}),
      ...(filter.status ? { status: filter.status } : {}),
      ...(this.periodWhere(filter.from, filter.to)
        ? { createdAt: this.periodWhere(filter.from, filter.to) }
        : {}),
    };
    return this.prisma.payment.findMany({
      where,
      select: { metodo: true, valor: true },
    });
  }

  listPendingBefore(threshold: Date): Promise<PaymentWithCustomerRef[]> {
    return this.prisma.payment.findMany({
      where: { status: 'PENDENTE', createdAt: { lte: threshold } },
      include: PAYMENT_INCLUDES.customerRef,
      orderBy: { createdAt: 'asc' },
    });
  }
}
