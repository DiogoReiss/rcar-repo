import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { BillingCycle, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuditService } from '../../common/audit/audit.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import {
  PAYMENT_GATEWAY,
  PaymentGateway,
  GatewayChargeMethod,
} from '../payments/payment-gateway.js';

interface ActingUser {
  id?: string;
  role?: string;
}

/** Consolidated recurring invoices are raised as boletos by default. */
const DEFAULT_METHOD: GatewayChargeMethod = 'BOLETO';

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Turns MasterAgreements (contrato-mestre) into automatic recurring,
 * consolidated invoices. A recurring job calls {@link runCycle}, which raises
 * ONE consolidated charge per due agreement via the {@link PaymentGateway}
 * port, advances `proximoCiclo`, audits and notifies the customer.
 *
 * Every generated charge is idempotent per (agreement, cycle date) — enforced
 * both by an existence guard and the `@@unique([masterAgreementId,
 * cicloReferencia])` constraint — so a re-run in the same window never
 * double-bills.
 */
@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
    @Inject(PAYMENT_GATEWAY)
    private readonly gateway: PaymentGateway,
  ) {}

  /**
   * Advances a cycle anchor by one period. SEMANAL adds 7 days; MENSAL adds one
   * month, honoring `diaVencimento` (clamped to the target month's length).
   */
  nextProximoCiclo(
    base: Date,
    ciclo: BillingCycle,
    diaVencimento?: number | null,
  ): Date {
    const anchor = startOfDay(base);
    if (ciclo === 'SEMANAL') {
      anchor.setDate(anchor.getDate() + 7);
      return anchor;
    }
    // Move to the first of next month before setting the day to avoid overflow
    // (e.g. Jan 31 + 1 month must not roll into March).
    const desiredDay = diaVencimento ?? anchor.getDate();
    const next = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1);
    const lastDay = new Date(
      next.getFullYear(),
      next.getMonth() + 1,
      0,
    ).getDate();
    next.setDate(Math.min(desiredDay, lastDay));
    return next;
  }

  private activeAmount(items: Array<{ ativo: boolean; valorCiclo: unknown }>) {
    return round2(
      items
        .filter((i) => i.ativo)
        .reduce((acc, i) => acc + Number(i.valorCiclo), 0),
    );
  }

  /** Preview the invoice that the next cycle would generate (no side effects). */
  async previewInvoice(id: string) {
    const agreement = await this.prisma.masterAgreement.findUnique({
      where: { id },
      include: {
        items: { where: { ativo: true } },
        customer: { select: { id: true, nome: true } },
      },
    });
    if (!agreement) throw new NotFoundException('Acordo não encontrado');

    return {
      agreementId: agreement.id,
      customer: agreement.customer,
      ciclo: agreement.ciclo,
      status: agreement.status,
      proximoCiclo: agreement.proximoCiclo,
      valorCiclo: this.activeAmount(agreement.items),
      veiculosAtivos: agreement.items.length,
    };
  }

  /**
   * Raises the consolidated charge for a single agreement's cycle. Idempotent
   * per (agreement, cycle date): a second call for the same window returns the
   * existing Payment instead of creating a new one.
   */
  async generateInvoice(id: string, cycleDate: Date, user?: ActingUser) {
    const agreement = await this.prisma.masterAgreement.findUnique({
      where: { id },
      include: {
        items: { where: { ativo: true } },
        customer: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
            canalPreferido: true,
          },
        },
      },
    });
    if (!agreement) throw new NotFoundException('Acordo não encontrado');

    const cicloReferencia = startOfDay(cycleDate);

    const existing = await this.prisma.payment.findFirst({
      where: { masterAgreementId: id, cicloReferencia },
    });
    if (existing) {
      return { payment: existing, created: false };
    }

    const amount = this.activeAmount(agreement.items);
    if (amount <= 0) {
      this.logger.warn(
        `Acordo ${id} sem itens ativos — ciclo ignorado (${cicloReferencia.toISOString()})`,
      );
      return { payment: null, created: false, skipped: 'sem-itens-ativos' };
    }

    const charge = await this.gateway.createCharge({
      amount,
      method: DEFAULT_METHOD,
      description: `Cobrança consolidada acordo ${id} (${agreement.ciclo})`,
      customerName: agreement.customer?.nome ?? undefined,
    });

    let payment;
    try {
      payment = await this.prisma.payment.create({
        data: {
          refType: 'MASTER_AGREEMENT',
          masterAgreementId: id,
          cicloReferencia,
          customerId: agreement.customerId,
          valor: new Prisma.Decimal(amount),
          metodo: DEFAULT_METHOD,
          status: 'PENDENTE',
          pagarmeTxId: charge.externalId,
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        const raced = await this.prisma.payment.findFirst({
          where: { masterAgreementId: id, cicloReferencia },
        });
        if (raced) return { payment: raced, created: false };
      }
      throw err;
    }

    await this.audit.record({
      userId: user?.id ?? null,
      acao: 'MASTER_AGREEMENT_INVOICE_GENERATED',
      entidade: 'MasterAgreement',
      entidadeId: id,
      detalhes: {
        paymentId: payment.id,
        cicloReferencia: cicloReferencia.toISOString(),
        valor: amount,
        externalId: charge.externalId,
      },
    });

    await this.notifyCustomer(agreement, amount, cicloReferencia);

    return { payment, created: true, boletoUrl: charge.boletoUrl };
  }

  /**
   * Manually triggers this agreement's current cycle and advances its anchor.
   * Reuses {@link generateInvoice} so re-triggering the same cycle is a no-op.
   */
  async chargeNow(id: string, user?: ActingUser) {
    const agreement = await this.prisma.masterAgreement.findUnique({
      where: { id },
      select: {
        id: true,
        ciclo: true,
        diaVencimento: true,
        proximoCiclo: true,
      },
    });
    if (!agreement) throw new NotFoundException('Acordo não encontrado');

    const cycleDate = agreement.proximoCiclo ?? new Date();
    const result = await this.generateInvoice(id, cycleDate, user);

    if (result.created) {
      await this.prisma.masterAgreement.update({
        where: { id },
        data: {
          proximoCiclo: this.nextProximoCiclo(
            cycleDate,
            agreement.ciclo,
            agreement.diaVencimento,
          ),
        },
      });
    }

    return result;
  }

  /**
   * Recurring entrypoint: bills every ATIVO agreement whose `proximoCiclo` is
   * due, then advances each anchor by one cycle.
   */
  async runCycle(now: Date = new Date(), user?: ActingUser) {
    const due = await this.prisma.masterAgreement.findMany({
      where: {
        status: 'ATIVO',
        proximoCiclo: { not: null, lte: now },
      },
      select: {
        id: true,
        ciclo: true,
        diaVencimento: true,
        proximoCiclo: true,
      },
    });

    let faturas = 0;
    let totalValor = 0;
    for (const agreement of due) {
      const cycleDate = agreement.proximoCiclo ?? now;
      const result = await this.generateInvoice(agreement.id, cycleDate, user);
      if (result.created && result.payment) {
        faturas += 1;
        totalValor = round2(totalValor + Number(result.payment.valor));
      }
      await this.prisma.masterAgreement.update({
        where: { id: agreement.id },
        data: {
          proximoCiclo: this.nextProximoCiclo(
            cycleDate,
            agreement.ciclo,
            agreement.diaVencimento,
          ),
        },
      });
    }

    this.logger.log(
      `Ciclo de cobrança: ${due.length} acordo(s) processado(s), ${faturas} fatura(s) gerada(s)`,
    );
    return { processados: due.length, faturas, totalValor };
  }

  /**
   * Reconciles consolidated agreement charges against their child contracts,
   * keeping traceability per vehicle. Surfaces agreements with unpaid cycles.
   */
  async reconciliation() {
    const agreements = await this.prisma.masterAgreement.findMany({
      where: { payments: { some: {} } },
      include: {
        customer: { select: { id: true, nome: true, cpfCnpj: true } },
        payments: {
          where: { refType: 'MASTER_AGREEMENT' },
          orderBy: { cicloReferencia: 'desc' },
        },
        items: {
          include: {
            vehicle: { select: { id: true, placa: true, modelo: true } },
          },
        },
      },
    });

    const data = agreements.map((a) => {
      const faturado = round2(
        a.payments.reduce((acc, p) => acc + Number(p.valor), 0),
      );
      const pago = round2(
        a.payments
          .filter((p) => p.status === 'CONFIRMADO')
          .reduce((acc, p) => acc + Number(p.valor), 0),
      );
      const pendente = round2(faturado - pago);
      return {
        agreementId: a.id,
        customer: a.customer,
        ciclo: a.ciclo,
        status: a.status,
        faturado,
        pago,
        pendente,
        ciclos: a.payments.map((p) => ({
          paymentId: p.id,
          cicloReferencia: p.cicloReferencia,
          valor: Number(p.valor),
          status: p.status,
        })),
        contratosFilhos: a.items.map((i) => ({
          itemId: i.id,
          vehicle: i.vehicle,
          contractId: i.contractId,
          valorCiclo: Number(i.valorCiclo),
          ativo: i.ativo,
        })),
      };
    });

    return {
      totalRegistros: data.length,
      totalFaturado: round2(data.reduce((a, r) => a + r.faturado, 0)),
      totalPago: round2(data.reduce((a, r) => a + r.pago, 0)),
      totalPendente: round2(data.reduce((a, r) => a + r.pendente, 0)),
      data,
    };
  }

  private async notifyCustomer(
    agreement: {
      id: string;
      customer: {
        nome: string;
        email: string | null;
        telefone: string | null;
        canalPreferido: Parameters<NotificationsService['notify']>[0];
      } | null;
    },
    amount: number,
    cicloReferencia: Date,
  ) {
    const customer = agreement.customer;
    if (!customer || (!customer.email && !customer.telefone)) return;
    const valor = amount.toFixed(2);
    await this.notifications.notify(customer.canalPreferido, {
      recipient: {
        nome: customer.nome,
        email: customer.email,
        phone: customer.telefone,
      },
      subject: '🧾 Fatura do ciclo — RCar',
      text: `Olá ${customer.nome}, sua fatura consolidada de R$ ${valor} referente ao ciclo de ${cicloReferencia.toLocaleDateString('pt-BR')} está disponível.`,
      html: `<p>Olá <strong>${customer.nome}</strong>, sua fatura consolidada de <strong>R$ ${valor}</strong> referente ao ciclo de ${cicloReferencia.toLocaleDateString('pt-BR')} está disponível.</p>`,
    });
  }
}
