import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  PaymentMethod,
  PaymentRefType,
  PaymentStatus,
  Prisma,
} from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service.js';
import { QueryPaymentsDto } from './dto/query-payments.dto.js';
import { CreateChargeDto } from './dto/create-charge.dto.js';
import { PaymentWebhookDto } from './dto/payment-webhook.dto.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { AuditService } from '../../common/audit/audit.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { verifyHmacSignature } from '../../common/webhooks/webhook-signature.util.js';
import {
  PAYMENT_GATEWAY,
  PaymentGateway,
  GatewayChargeMethod,
} from './payment-gateway.js';

interface ActingUser {
  id?: string;
  role?: string;
}

interface PayableInfo {
  valor: number;
  customerId: string | null;
  customerName: string | null;
  scheduleId?: string;
  queueId?: string;
  contractId?: string;
}

const WEBHOOK_SOURCE = 'PAYMENT';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
    private readonly config: ConfigService,
    @Inject(PAYMENT_GATEWAY)
    private readonly gateway: PaymentGateway,
  ) {}

  // ─── Online charges (Pagar.me port) ──────────────────────────────────────

  private async resolvePayable(
    refType: PaymentRefType,
    refId: string,
  ): Promise<PayableInfo> {
    if (refType === 'RENTAL_CONTRACT') {
      const contract = await this.prisma.rentalContract.findUnique({
        where: { id: refId },
        include: { customer: { select: { id: true, nome: true } } },
      });
      if (!contract) throw new NotFoundException('Contrato não encontrado');
      return {
        valor: Number(contract.valorTotalReal ?? contract.valorTotal),
        customerId: contract.customerId,
        customerName: contract.customer?.nome ?? null,
        contractId: contract.id,
      };
    }
    if (refType === 'WASH_SCHEDULE') {
      const schedule = await this.prisma.washSchedule.findUnique({
        where: { id: refId },
        include: {
          service: { select: { preco: true } },
          customer: { select: { id: true, nome: true } },
        },
      });
      if (!schedule) throw new NotFoundException('Agendamento não encontrado');
      return {
        valor: Number(schedule.service.preco),
        customerId: schedule.customerId,
        customerName: schedule.customer?.nome ?? schedule.nomeAvulso ?? null,
        scheduleId: schedule.id,
      };
    }
    const queue = await this.prisma.washQueue.findUnique({
      where: { id: refId },
      include: {
        service: { select: { preco: true } },
        customer: { select: { id: true, nome: true } },
      },
    });
    if (!queue) throw new NotFoundException('Item de fila não encontrado');
    return {
      valor: Number(queue.service.preco),
      customerId: queue.customerId,
      customerName: queue.customer?.nome ?? queue.nomeAvulso ?? null,
      queueId: queue.id,
    };
  }

  /**
   * Starts an online charge for a payable resource through the
   * {@link PaymentGateway} port, creating a PENDENTE Payment that records the
   * external transaction id. Idempotent per payable + method.
   */
  async startCharge(dto: CreateChargeDto, user?: ActingUser) {
    const method: GatewayChargeMethod = dto.metodo ?? 'PIX';
    const payable = await this.resolvePayable(dto.refType, dto.refId);

    const existing = await this.prisma.payment.findFirst({
      where: {
        refType: dto.refType,
        status: 'PENDENTE',
        ...(payable.contractId ? { contractId: payable.contractId } : {}),
        ...(payable.scheduleId ? { scheduleId: payable.scheduleId } : {}),
        ...(payable.queueId ? { queueId: payable.queueId } : {}),
      },
    });
    if (existing) return existing;

    const charge = await this.gateway.createCharge({
      amount: payable.valor,
      method,
      description: `Cobrança ${dto.refType} ${dto.refId}`,
      customerName: payable.customerName ?? undefined,
      cardToken: dto.cardToken,
      dueDate: dto.dueDate,
    });

    const payment = await this.prisma.payment.create({
      data: {
        refType: dto.refType,
        contractId: payable.contractId ?? null,
        scheduleId: payable.scheduleId ?? null,
        queueId: payable.queueId ?? null,
        customerId: payable.customerId,
        valor: new Prisma.Decimal(payable.valor),
        metodo: method as PaymentMethod,
        status: 'PENDENTE',
        pagarmeTxId: charge.externalId,
      },
    });

    await this.audit.record({
      userId: user?.id ?? null,
      acao: 'PAYMENT_CHARGE_STARTED',
      entidade: 'Payment',
      entidadeId: payment.id,
      detalhes: {
        refType: dto.refType,
        refId: dto.refId,
        metodo: method,
        externalId: charge.externalId,
        valor: payable.valor,
      },
    });

    return {
      ...payment,
      pixQrCode: charge.pixQrCode,
      boletoUrl: charge.boletoUrl,
    };
  }

  async findCharge(id: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    if (!payment) throw new NotFoundException('Pagamento não encontrado');
    return payment;
  }

  /**
   * Reconciles a Payment from an inbound gateway webhook. Authenticated via
   * HMAC signature and idempotent: a repeated (source, eventId) is a no-op, so
   * duplicated webhooks never count a payment twice. On CONFIRMED, emails the
   * customer a receipt (comprovante).
   */
  async handleWebhook(dto: PaymentWebhookDto, signatureHeader?: string) {
    const secret = this.config.get<string>(
      'PAYMENT_WEBHOOK_SECRET',
      'dev-payment-secret',
    );
    const authentic = verifyHmacSignature(
      secret,
      `${dto.eventId}.${dto.externalId}.${dto.status}`,
      signatureHeader,
    );
    if (!authentic) {
      throw new ForbiddenException('Assinatura do webhook inválida.');
    }

    try {
      await this.prisma.webhookEvent.create({
        data: {
          source: WEBHOOK_SOURCE,
          eventId: dto.eventId,
          status: dto.status,
          detalhes: { externalId: dto.externalId },
        },
      });
    } catch {
      this.logger.log(
        `Webhook de pagamento duplicado ignorado (eventId=${dto.eventId})`,
      );
      return { received: true, duplicate: true };
    }

    const payment = await this.prisma.payment.findFirst({
      where: { pagarmeTxId: dto.externalId },
      include: {
        customer: { select: { nome: true, email: true, telefone: true } },
      },
    });
    if (!payment) {
      this.logger.warn(
        `Webhook de pagamento sem Payment correspondente (externalId=${dto.externalId})`,
      );
      return { received: true, matched: false };
    }

    const newStatus: PaymentStatus =
      dto.status === 'CONFIRMED' ? 'CONFIRMADO' : 'CANCELADO';

    // Idempotent at the domain level too: skip if already in a terminal state.
    if (payment.status === newStatus) {
      return { received: true, paymentId: payment.id, status: newStatus };
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: newStatus },
    });

    await this.audit.record({
      acao: `PAYMENT_WEBHOOK_${dto.status}`,
      entidade: 'Payment',
      entidadeId: payment.id,
      detalhes: { eventId: dto.eventId, externalId: dto.externalId },
    });

    if (newStatus === 'CONFIRMADO') {
      await this.sendReceiptEmail(payment);
    }

    return { received: true, paymentId: payment.id, status: newStatus };
  }

  /** Payment receipt (comprovante) — available once confirmed. */
  async getReceipt(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        customer: { select: { nome: true, cpfCnpj: true } },
      },
    });
    if (!payment) throw new NotFoundException('Pagamento não encontrado');
    if (payment.status !== 'CONFIRMADO') {
      throw new NotFoundException(
        'Comprovante disponível apenas para pagamentos confirmados.',
      );
    }
    return {
      comprovante: payment.id,
      valor: Number(payment.valor),
      metodo: payment.metodo,
      status: payment.status,
      refType: payment.refType,
      transacaoExterna: payment.pagarmeTxId,
      cliente: payment.customer?.nome ?? null,
      data: payment.updatedAt,
    };
  }

  private async sendReceiptEmail(payment: {
    id: string;
    valor: Prisma.Decimal;
    metodo: PaymentMethod;
    customer?: {
      nome: string;
      email: string | null;
      telefone: string | null;
    } | null;
  }) {
    const customer = payment.customer;
    if (!customer?.email && !customer?.telefone) return;
    await this.notifications.notify('EMAIL', {
      recipient: {
        nome: customer.nome,
        email: customer.email,
        phone: customer.telefone,
      },
      subject: '✅ Pagamento confirmado — RCar',
      text: `Olá ${customer.nome}, recebemos seu pagamento de R$ ${Number(
        payment.valor,
      ).toFixed(2)} (${payment.metodo}). Comprovante: ${payment.id}`,
      html: `<p>Olá <strong>${customer.nome}</strong>,</p>
             <p>Recebemos seu pagamento de <strong>R$ ${Number(
               payment.valor,
             ).toFixed(2)}</strong> (${payment.metodo}).</p>
             <p>Comprovante: <code>${payment.id}</code></p>`,
    });
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

  async findAll(query: QueryPaymentsDto, pagination?: PaginationDto) {
    const { page = 1, perPage = 20 } = pagination ?? {};
    const safePage = Math.max(1, page);

    const where: Prisma.PaymentWhereInput = {
      ...(query.refType ? { refType: query.refType } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.metodo ? { metodo: query.metodo } : {}),
      ...(this.periodWhere(query.from, query.to)
        ? { createdAt: this.periodWhere(query.from, query.to) }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        include: {
          customer: { select: { id: true, nome: true, cpfCnpj: true } },
          contract: {
            select: {
              id: true,
              vehicle: { select: { placa: true, modelo: true } },
            },
          },
          schedule: { select: { id: true, dataHora: true } },
          queue: { select: { id: true, createdAt: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (safePage - 1) * perPage,
        take: perPage,
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      data,
      total,
      page: safePage,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  async methodSummary(
    query: Pick<QueryPaymentsDto, 'from' | 'to' | 'status' | 'refType'>,
  ) {
    const where: Prisma.PaymentWhereInput = {
      ...(query.refType ? { refType: query.refType } : {}),
      ...(query.status ? { status: query.status } : { status: 'CONFIRMADO' }),
      ...(this.periodWhere(query.from, query.to)
        ? { createdAt: this.periodWhere(query.from, query.to) }
        : {}),
    };

    const rows = await this.prisma.payment.findMany({
      where,
      select: { metodo: true, valor: true },
    });

    const methods: Record<
      PaymentMethod,
      { metodo: PaymentMethod; quantidade: number; valor: number }
    > = {
      DINHEIRO: { metodo: 'DINHEIRO', quantidade: 0, valor: 0 },
      PIX: { metodo: 'PIX', quantidade: 0, valor: 0 },
      CARTAO_CREDITO: { metodo: 'CARTAO_CREDITO', quantidade: 0, valor: 0 },
      CARTAO_DEBITO: { metodo: 'CARTAO_DEBITO', quantidade: 0, valor: 0 },
    };

    for (const row of rows) {
      methods[row.metodo].quantidade += 1;
      methods[row.metodo].valor += Number(row.valor);
    }

    const data = Object.values(methods);
    const totalValor = data.reduce((a, m) => a + m.valor, 0);

    return {
      totalValor,
      totalQuantidade: data.reduce((a, m) => a + m.quantidade, 0),
      data: data.map((m) => ({
        ...m,
        percentual: totalValor > 0 ? (m.valor / totalValor) * 100 : 0,
      })),
    };
  }

  async reconciliation(days = 7) {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - days);
    threshold.setHours(23, 59, 59, 999);

    const pendentes = await this.prisma.payment.findMany({
      where: {
        status: 'PENDENTE',
        createdAt: { lte: threshold },
      },
      include: {
        customer: { select: { id: true, nome: true, cpfCnpj: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      threshold: threshold.toISOString(),
      totalRegistros: pendentes.length,
      totalValor: pendentes.reduce((a, p) => a + Number(p.valor), 0),
      data: pendentes,
    };
  }
}
