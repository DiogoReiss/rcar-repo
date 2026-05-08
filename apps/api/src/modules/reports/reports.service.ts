import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private parsePeriod(from?: string, to?: string) {
    const start = from ? new Date(from) : new Date();
    const end = to ? new Date(to) : new Date();
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  async getDailySummary(date?: string) {
    const target = date ? new Date(date) : new Date();
    target.setHours(0, 0, 0, 0);
    const end = new Date(target);
    end.setHours(23, 59, 59, 999);

    const [schedules, queues, contracts, lowStock, stockMovements, maintenances] = await Promise.all([
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
      this.prisma.stockMovement.findMany({
        where: { createdAt: { gte: target, lte: end }, tipo: 'SAIDA' },
        include: { product: { select: { custoUnitario: true } } },
      }),
      this.prisma.vehicleMaintenance.findMany({ where: { data: { gte: target, lte: end } }, select: { custo: true } }),
    ]);

    const washRevenue = [
      ...schedules.filter(s => s.status === 'CONCLUIDO').map(s => Number(s.service.preco)),
      ...queues.filter(q => q.status === 'CONCLUIDO').map(q => Number(q.service.preco)),
    ].reduce((a, b) => a + b, 0);

    const rentalRevenue = contracts
      .filter(c => c.status !== 'CANCELADO')
      .reduce((a, c) => a + Number(c.valorTotal), 0);

    const custoInsumos = stockMovements.reduce(
      (a, m) => a + Number(m.quantidade) * Number(m.product.custoUnitario ?? 0),
      0,
    );
    const custoManutencao = maintenances.reduce((a, m) => a + Number(m.custo), 0);

    return {
      date: target.toISOString().slice(0, 10),
      lavajato: {
        agendados: schedules.filter(s => s.status === 'AGENDADO').length,
        concluidos: schedules.filter(s => s.status === 'CONCLUIDO').length,
        cancelados: schedules.filter(s => s.status === 'CANCELADO').length,
        walkins: queues.length,
        receita: washRevenue,
        custoInsumos,
      },
      aluguel: {
        novasReservas: contracts.length,
        receita: rentalRevenue,
        custoManutencao,
      },
      financeiro: {
        receitaTotal: washRevenue + rentalRevenue,
        custosDiretos: custoInsumos + custoManutencao,
        margemBruta: washRevenue + rentalRevenue - (custoInsumos + custoManutencao),
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

    const [
      washPayments,
      rentalPayments,
      newCustomers,
      newContracts,
      stockMovements,
      maintenances,
      closedContracts,
      movementsBeforeStart,
      movementsUntilEnd,
      products,
    ] = await Promise.all([
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
      this.prisma.stockMovement.findMany({
        where: { createdAt: { gte: start, lte: end }, tipo: 'SAIDA' },
        include: { product: { select: { custoUnitario: true } } },
      }),
      this.prisma.vehicleMaintenance.findMany({ where: { data: { gte: start, lte: end } }, select: { custo: true } }),
      this.prisma.rentalContract.findMany({
        where: { status: 'ENCERRADO', dataDevReal: { gte: start, lte: end } },
        select: {
          id: true,
          valorTotal: true,
          valorTotalReal: true,
          payments: {
            where: { status: 'CONFIRMADO' },
            select: { valor: true },
          },
        },
      }),
      this.prisma.stockMovement.findMany({
        where: { createdAt: { lt: start } },
        select: { createdAt: true, quantidade: true, tipo: true, productId: true },
      }),
      this.prisma.stockMovement.findMany({
        where: { createdAt: { lte: end } },
        select: { createdAt: true, quantidade: true, tipo: true, productId: true },
      }),
      this.prisma.product.findMany({
        where: { ativo: true, deletedAt: null },
        select: { id: true, custoUnitario: true, quantidadeAtual: true },
      }),
    ]);

    const washTotal = washPayments.reduce((a, p) => a + Number(p.valor), 0);
    const rentalTotal = rentalPayments.reduce((a, p) => a + Number(p.valor), 0);
    const custoInsumos = stockMovements.reduce(
      (a, m) => a + Number(m.quantidade) * Number(m.product.custoUnitario ?? 0),
      0,
    );
    const custoManutencao = maintenances.reduce((a, m) => a + Number(m.custo), 0);
    const faturado = closedContracts.reduce((a, c) => a + Number(c.valorTotalReal ?? c.valorTotal), 0);
    const recebido = closedContracts.reduce(
      (a, c) => a + c.payments.reduce((sum, p) => sum + Number(p.valor), 0),
      0,
    );

    const qtyByProductAt = (movements: Array<{ tipo: string; quantidade: Prisma.Decimal; productId: string }>) => {
      const map = new Map<string, number>();
      for (const mv of movements) {
        const q = Number(mv.quantidade);
        const current = map.get(mv.productId) ?? 0;
        if (mv.tipo === 'ENTRADA') map.set(mv.productId, current + q);
        if (mv.tipo === 'SAIDA') map.set(mv.productId, current - q);
        if (mv.tipo === 'AJUSTE') map.set(mv.productId, q);
      }
      return map;
    };
    const startQty = qtyByProductAt(movementsBeforeStart as Array<{ tipo: string; quantidade: Prisma.Decimal; productId: string }>);
    const endQty = qtyByProductAt(movementsUntilEnd as Array<{ tipo: string; quantidade: Prisma.Decimal; productId: string }>);
    const valorEstoqueInicio = products.reduce((a, p) => a + (startQty.get(p.id) ?? Number(p.quantidadeAtual)) * Number(p.custoUnitario ?? 0), 0);
    const valorEstoqueFim = products.reduce((a, p) => a + (endQty.get(p.id) ?? Number(p.quantidadeAtual)) * Number(p.custoUnitario ?? 0), 0);

    return {
      period: `${y}-${String(m + 1).padStart(2, '0')}`,
      receita: { lavajato: washTotal, aluguel: rentalTotal, total: washTotal + rentalTotal },
      custos: {
        insumos: custoInsumos,
        manutencao: custoManutencao,
        total: custoInsumos + custoManutencao,
      },
      faturamentoAluguel: {
        faturado,
        recebido,
        aReceber: Math.max(0, faturado - recebido),
      },
      estoque: {
        valorInicio: valorEstoqueInicio,
        valorFim: valorEstoqueFim,
        variacao: valorEstoqueFim - valorEstoqueInicio,
      },
      novosClientes: newCustomers,
      novosContratos: newContracts,
    };
  }

  async getStockCostAnalysis(from?: string, to?: string) {
    const { start, end } = this.parsePeriod(from, to);
    const [movements, products] = await Promise.all([
      this.prisma.stockMovement.findMany({
        where: { createdAt: { gte: start, lte: end }, tipo: 'SAIDA' },
        include: { product: { select: { id: true, nome: true, unidade: true, custoUnitario: true } } },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.product.findMany({
        where: { ativo: true, deletedAt: null },
        select: { quantidadeAtual: true, custoUnitario: true },
      }),
    ]);

    const byProduct = new Map<string, { productId: string; nome: string; unidade: string; quantidade: number; custoTotal: number }>();
    for (const m of movements) {
      const key = m.product.id;
      const qty = Number(m.quantidade);
      const cost = qty * Number(m.product.custoUnitario ?? 0);
      const current = byProduct.get(key) ?? {
        productId: key,
        nome: m.product.nome,
        unidade: m.product.unidade,
        quantidade: 0,
        custoTotal: 0,
      };
      current.quantidade += qty;
      current.custoTotal += cost;
      byProduct.set(key, current);
    }

    const produtos = Array.from(byProduct.values()).sort((a, b) => b.custoTotal - a.custoTotal);
    const custoTotal = produtos.reduce((a, p) => a + p.custoTotal, 0);
    const servicesCount = await Promise.all([
      this.prisma.washSchedule.count({ where: { dataHora: { gte: start, lte: end }, status: 'CONCLUIDO' } }),
      this.prisma.washQueue.count({ where: { concluidoAt: { gte: start, lte: end }, status: 'CONCLUIDO' } }),
    ]).then(([a, b]) => a + b);
    const valorEstoqueAtual = products.reduce(
      (a, p) => a + Number(p.quantidadeAtual) * Number(p.custoUnitario ?? 0),
      0,
    );

    return {
      periodo: { from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) },
      custoTotal,
      itens: movements.length,
      valorEstoqueAtual,
      eficiencia: {
        servicosConcluidos: servicesCount,
        custoPorServico: servicesCount > 0 ? custoTotal / servicesCount : 0,
      },
      produtos,
    };
  }

  async getMaintenanceCosts(from?: string, to?: string) {
    const { start, end } = this.parsePeriod(from, to);
    const [maintenances, rentalPayments] = await Promise.all([
      this.prisma.vehicleMaintenance.findMany({
        where: { data: { gte: start, lte: end } },
        include: { vehicle: { select: { id: true, placa: true, modelo: true, categoria: true } } },
        orderBy: { data: 'desc' },
      }),
      this.prisma.payment.findMany({
        where: {
          createdAt: { gte: start, lte: end },
          status: 'CONFIRMADO',
          refType: 'RENTAL_CONTRACT',
        },
        select: { valor: true, contract: { select: { vehicleId: true, vehicle: { select: { placa: true, modelo: true, categoria: true } } } } },
      }),
    ]);

    const byVehicle = new Map<string, {
      vehicleId: string;
      placa: string;
      modelo: string;
      categoria: string;
      custo: number;
      receita: number;
      lucroBruto: number;
      qtd: number;
      ultimaData: string;
    }>();

    for (const m of maintenances) {
      const key = m.vehicle.id;
      const current = byVehicle.get(key) ?? {
        vehicleId: m.vehicle.id,
        placa: m.vehicle.placa,
        modelo: m.vehicle.modelo,
        categoria: m.vehicle.categoria,
        custo: 0,
        receita: 0,
        lucroBruto: 0,
        qtd: 0,
        ultimaData: m.data.toISOString(),
      };
      current.custo += Number(m.custo);
      current.qtd += 1;
      if (new Date(m.data).getTime() > new Date(current.ultimaData).getTime()) {
        current.ultimaData = m.data.toISOString();
      }
      byVehicle.set(key, current);
    }

    for (const pay of rentalPayments) {
      const vehicleId = pay.contract?.vehicleId;
      const vehicle = pay.contract?.vehicle;
      if (!vehicleId || !vehicle) continue;
      const current = byVehicle.get(vehicleId) ?? {
        vehicleId,
        placa: vehicle.placa,
        modelo: vehicle.modelo,
        categoria: vehicle.categoria,
        custo: 0,
        receita: 0,
        lucroBruto: 0,
        qtd: 0,
        ultimaData: start.toISOString(),
      };
      current.receita += Number(pay.valor);
      byVehicle.set(vehicleId, current);
    }

    for (const item of byVehicle.values()) {
      item.lucroBruto = item.receita - item.custo;
    }

    const veiculos = Array.from(byVehicle.values()).sort((a, b) => b.lucroBruto - a.lucroBruto);
    const totalCusto = veiculos.reduce((a, v) => a + v.custo, 0);
    const totalReceita = veiculos.reduce((a, v) => a + v.receita, 0);

    return {
      periodo: { from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) },
      totalCusto,
      totalReceita,
      totalLucroBruto: totalReceita - totalCusto,
      porTipo: await this.prisma.vehicleMaintenance.groupBy({
        by: ['tipo'],
        where: { data: { gte: start, lte: end } },
        _sum: { custo: true },
        _count: { _all: true },
      }),
      manutencoes: maintenances.length,
      veiculos,
    };
  }

  async getRentalReceivables() {
    const contracts = await this.prisma.rentalContract.findMany({
      where: { status: 'ENCERRADO' },
      include: {
        customer: { select: { id: true, nome: true, cpfCnpj: true } },
        vehicle: { select: { id: true, placa: true, modelo: true } },
        payments: {
          where: { status: 'CONFIRMADO' },
          select: { id: true, valor: true, metodo: true, createdAt: true },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { dataDevReal: 'desc' },
    });

    const now = new Date();
    const data = contracts
      .map((c) => {
        const faturado = Number(c.valorTotalReal ?? c.valorTotal);
        const pago = c.payments.reduce((a, p) => a + Number(p.valor), 0);
        const pendente = Math.max(0, faturado - pago);
        const dueDate = c.dataDevReal
          ? new Date(new Date(c.dataDevReal).getTime() + 3 * 24 * 60 * 60 * 1000)
          : null;
        const overdue = dueDate ? dueDate.getTime() < now.getTime() : false;
        return {
          contractId: c.id,
          customer: c.customer,
          vehicle: c.vehicle,
          dataDevReal: c.dataDevReal,
          dueDate,
          overdue,
          faturado,
          pago,
          pendente,
          payments: c.payments,
        };
      })
      .filter((c) => c.pendente > 0);

    return {
      totalRegistros: data.length,
      totalFaturado: data.reduce((a, r) => a + r.faturado, 0),
      totalPago: data.reduce((a, r) => a + r.pago, 0),
      totalPendente: data.reduce((a, r) => a + r.pendente, 0),
      aging: {
        vencidos: data.filter((r) => r.overdue).reduce((a, r) => a + r.pendente, 0),
        aVencer: data.filter((r) => !r.overdue).reduce((a, r) => a + r.pendente, 0),
      },
      data,
    };
  }

  async getFinancialSummary(from?: string, to?: string) {
    const { start, end } = this.parsePeriod(from, to);
    const [washPayments, rentalPayments, stockMovements, maintenances, incidents] = await Promise.all([
      this.prisma.payment.findMany({
        where: {
          createdAt: { gte: start, lte: end },
          status: 'CONFIRMADO',
          refType: { in: ['WASH_SCHEDULE', 'WASH_QUEUE'] },
        },
        select: { valor: true },
      }),
      this.prisma.payment.findMany({
        where: { createdAt: { gte: start, lte: end }, status: 'CONFIRMADO', refType: 'RENTAL_CONTRACT' },
        select: { valor: true },
      }),
      this.prisma.stockMovement.findMany({
        where: { createdAt: { gte: start, lte: end }, tipo: 'SAIDA' },
        include: { product: { select: { custoUnitario: true } } },
      }),
      this.prisma.vehicleMaintenance.findMany({ where: { data: { gte: start, lte: end } }, select: { custo: true } }),
      this.prisma.contractIncident.findMany({
        where: { data: { gte: start, lte: end }, cobradoCliente: true },
        select: { valor: true, tipo: true },
      }),
    ]);

    const receitaLavajato = washPayments.reduce((a, p) => a + Number(p.valor), 0);
    const receitaAluguel = rentalPayments.reduce((a, p) => a + Number(p.valor), 0);
    const extrasAluguel = incidents.reduce((a, i) => a + Number(i.valor), 0);
    const extrasPorTipo = incidents.reduce<Record<string, number>>((acc, i) => {
      const key = i.tipo;
      acc[key] = (acc[key] ?? 0) + Number(i.valor);
      return acc;
    }, {});
    const custoInsumos = stockMovements.reduce(
      (a, m) => a + Number(m.quantidade) * Number(m.product.custoUnitario ?? 0),
      0,
    );
    const custoManutencao = maintenances.reduce((a, m) => a + Number(m.custo), 0);

    const receitaTotal = receitaLavajato + receitaAluguel + extrasAluguel;
    const custosDiretos = custoInsumos + custoManutencao;
    const margemBruta = receitaTotal - custosDiretos;

    return {
      periodo: { from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) },
      receita: {
        lavajato: receitaLavajato,
        aluguel: receitaAluguel,
        extrasAluguel,
        extrasPorTipo,
        total: receitaTotal,
      },
      custos: {
        insumos: custoInsumos,
        manutencao: custoManutencao,
        total: custosDiretos,
      },
      margem: {
        bruta: margemBruta,
        percentual: receitaTotal > 0 ? (margemBruta / receitaTotal) * 100 : 0,
      },
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
