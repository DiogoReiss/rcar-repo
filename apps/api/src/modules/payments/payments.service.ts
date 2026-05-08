import { Injectable } from '@nestjs/common';
import { PaymentMethod, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { QueryPaymentsDto } from './dto/query-payments.dto.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

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
