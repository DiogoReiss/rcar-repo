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

  // Dashboard charts — weekly services, rush hour, product usage, income/outcome
  async getChartsData() {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 6);
    weekAgo.setHours(0, 0, 0, 0);

    const [schedules, queues, payments, movements] = await Promise.all([
      this.prisma.washSchedule.findMany({
        where: { dataHora: { gte: weekAgo }, status: { not: 'CANCELADO' } },
        include: { service: { select: { nome: true, preco: true } } },
      }),
      this.prisma.washQueue.findMany({
        where: { createdAt: { gte: weekAgo }, status: { not: 'AGUARDANDO' } },
        include: { service: { select: { nome: true, preco: true } } },
      }),
      this.prisma.payment.findMany({
        where: { createdAt: { gte: weekAgo }, status: 'CONFIRMADO' },
        select: { createdAt: true, valor: true, refType: true },
      }),
      this.prisma.stockMovement.findMany({
        where: { createdAt: { gte: weekAgo }, tipo: 'SAIDA' },
        include: { product: { select: { nome: true } } },
      }),
    ]);

    // Build label array for last 7 days
    const dayLabels: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      dayLabels.push(d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }));
    }

    // Weekly services per day (schedules + queue combined)
    const servicesPerDay = new Array(7).fill(0);
    for (const s of schedules) {
      const d = new Date(s.dataHora);
      const daysAgo = Math.round((now.getTime() - d.getTime()) / 86400000);
      const idx = 6 - Math.min(6, Math.max(0, daysAgo));
      servicesPerDay[idx]++;
    }
    for (const q of queues) {
      const d = new Date(q.createdAt);
      const daysAgo = Math.round((now.getTime() - d.getTime()) / 86400000);
      const idx = 6 - Math.min(6, Math.max(0, daysAgo));
      servicesPerDay[idx]++;
    }

    // Rush hour (0–23)
    const hourLabels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}h`);
    const servicesPerHour = new Array(24).fill(0);
    for (const s of schedules) {
      servicesPerHour[new Date(s.dataHora).getHours()]++;
    }
    for (const q of queues) {
      servicesPerHour[new Date(q.createdAt).getHours()]++;
    }

    // Income/Outcome per day
    const incomePerDay = new Array(7).fill(0);
    const outcomePerDay = new Array(7).fill(0);
    for (const p of payments) {
      const d = new Date(p.createdAt);
      const daysAgo = Math.round((now.getTime() - d.getTime()) / 86400000);
      const idx = 6 - Math.min(6, Math.max(0, daysAgo));
      incomePerDay[idx] += Number(p.valor);
    }
    for (const m of movements) {
      const d = new Date(m.createdAt);
      const daysAgo = Math.round((now.getTime() - d.getTime()) / 86400000);
      const idx = 6 - Math.min(6, Math.max(0, daysAgo));
      outcomePerDay[idx] += Number(m.quantidade);
    }

    // Top product usage (by saidas count)
    const productMap = new Map<string, number>();
    for (const m of movements) {
      const nome = m.product.nome;
      productMap.set(nome, (productMap.get(nome) ?? 0) + Number(m.quantidade));
    }
    const sortedProducts = Array.from(productMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    return {
      weeklyServices: {
        labels: dayLabels,
        data: servicesPerDay,
      },
      rushHour: {
        labels: hourLabels,
        data: servicesPerHour,
      },
      incomeOutcome: {
        labels: dayLabels,
        income: incomePerDay,
        outcome: outcomePerDay,
      },
      productUsage: {
        labels: sortedProducts.map(([name]) => name),
        data: sortedProducts.map(([, qty]) => qty),
      },
    };
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
