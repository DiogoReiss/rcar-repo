import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDailySummary(date?: string) {
    const target = date ? new Date(date) : new Date();
    target.setHours(0, 0, 0, 0);
    const end = new Date(target);
    end.setHours(23, 59, 59, 999);

    const [schedules, queues, contracts, lowStock] = await Promise.all([
      this.prisma.washSchedule.findMany({
        where: { dataHora: { gte: target, lte: end } },
        include: { service: { select: { preco: true } } },
      }),
      this.prisma.washQueue.findMany({
        where: { createdAt: { gte: target, lte: end } },
        include: { service: { select: { preco: true } } },
      }),
      this.prisma.rentalContract.findMany({
        where: { createdAt: { gte: target, lte: end } },
        select: { valorTotal: true, status: true },
      }),
      this.prisma.$queryRaw<Array<{ id: string; nome: string; quantidade_atual: number; estoque_minimo: number }>>`
        SELECT id, nome, quantidade_atual, estoque_minimo
        FROM products WHERE ativo = true AND deleted_at IS NULL
        AND quantidade_atual <= estoque_minimo ORDER BY nome
      `,
    ]);

    const washRevenue = [
      ...schedules.filter(s => s.status === 'CONCLUIDO').map(s => Number(s.service.preco)),
      ...queues.filter(q => q.status === 'CONCLUIDO').map(q => Number(q.service.preco)),
    ].reduce((a, b) => a + b, 0);

    const rentalRevenue = contracts
      .filter(c => c.status !== 'CANCELADO')
      .reduce((a, c) => a + Number(c.valorTotal), 0);

    return {
      date: target.toISOString().slice(0, 10),
      lavajato: {
        agendados: schedules.filter(s => s.status === 'AGENDADO').length,
        concluidos: schedules.filter(s => s.status === 'CONCLUIDO').length,
        cancelados: schedules.filter(s => s.status === 'CANCELADO').length,
        walkins: queues.length,
        receita: washRevenue,
      },
      aluguel: {
        novasReservas: contracts.length,
        receita: rentalRevenue,
      },
      estoque: {
        alertasBaixoEstoque: lowStock.length,
        produtos: lowStock,
      },
    };
  }

  async getMonthlyStats(year?: number, month?: number) {
    const now = new Date();
    const y = year ?? now.getFullYear();
    const m = (month ?? now.getMonth() + 1) - 1;
    const start = new Date(y, m, 1);
    const end = new Date(y, m + 1, 0, 23, 59, 59, 999);

    const [washPayments, rentalPayments, newCustomers, newContracts] = await Promise.all([
      this.prisma.payment.findMany({
        where: { createdAt: { gte: start, lte: end }, status: 'CONFIRMADO', refType: { in: ['WASH_SCHEDULE', 'WASH_QUEUE'] } },
        select: { valor: true },
      }),
      this.prisma.payment.findMany({
        where: { createdAt: { gte: start, lte: end }, status: 'CONFIRMADO', refType: 'RENTAL_CONTRACT' },
        select: { valor: true },
      }),
      this.prisma.customer.count({ where: { createdAt: { gte: start, lte: end } } }),
      this.prisma.rentalContract.count({ where: { createdAt: { gte: start, lte: end } } }),
    ]);

    const washTotal = washPayments.reduce((a, p) => a + Number(p.valor), 0);
    const rentalTotal = rentalPayments.reduce((a, p) => a + Number(p.valor), 0);

    return {
      period: `${y}-${String(m + 1).padStart(2, '0')}`,
      receita: { lavajato: washTotal, aluguel: rentalTotal, total: washTotal + rentalTotal },
      novosClientes: newCustomers,
      novosContratos: newContracts,
    };
  }

  async getStockReport() {
    const products = await this.prisma.product.findMany({
      where: { ativo: true, deletedAt: null },
      include: {
        movements: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
      orderBy: { nome: 'asc' },
    });

    return products.map(p => ({
      id: p.id,
      nome: p.nome,
      unidade: p.unidade,
      quantidadeAtual: Number(p.quantidadeAtual),
      estoqueMinimo: Number(p.estoqueMinimo),
      baixoEstoque: Number(p.quantidadeAtual) <= Number(p.estoqueMinimo),
      ultimasMovimentacoes: p.movements,
    }));
  }

  // A10: Aggregated dashboard endpoint — single query replaces 5 parallel frontend requests
  async getDashboardKpis() {
    const [usersCount, vehiclesCount, customersCount, servicesCount, lowStock] = await Promise.all([
      this.prisma.user.count({ where: { ativo: true, deletedAt: null } }),
      this.prisma.vehicle.count({ where: { deletedAt: null } }),
      this.prisma.customer.count({ where: { ativo: true, deletedAt: null } }),
      this.prisma.washService.count({ where: { ativo: true } }),
      this.prisma.product.findMany({
        where: { ativo: true, deletedAt: null },
        select: { id: true, nome: true, unidade: true, quantidadeAtual: true, estoqueMinimo: true },
        orderBy: { nome: 'asc' },
      }).then(products =>
        products.filter(p => Number(p.quantidadeAtual) <= Number(p.estoqueMinimo)),
      ),
    ]);

    return { usersCount, vehiclesCount, customersCount, servicesCount, lowStock };
  }
}
