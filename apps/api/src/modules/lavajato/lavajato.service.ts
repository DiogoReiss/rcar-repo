import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma, WashScheduleStatus, WashQueueStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateScheduleDto } from './dto/create-schedule.dto.js';
import { UpdateScheduleDto } from './dto/update-schedule.dto.js';
import { CreateQueueEntryDto, CreatePaymentDto } from './dto/create-queue-entry.dto.js';
import { QueueEventsService } from './queue-events.service.js';

@Injectable()
export class LavajatoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queueEvents: QueueEventsService,
  ) {}

  // ─── Schedules ────────────────────────────────────────────────────────────

  async getSchedules(date?: string, month?: string) {
    const where: Prisma.WashScheduleWhereInput = {};
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      where.dataHora = { gte: start, lte: end };
    } else if (month) {
      // month format: YYYY-MM
      const [y, m] = month.split('-').map(Number);
      const start = new Date(y, m - 1, 1, 0, 0, 0, 0);
      const end   = new Date(y, m, 0, 23, 59, 59, 999);
      where.dataHora = { gte: start, lte: end };
    }
    return this.prisma.washSchedule.findMany({
      where,
      include: { service: true, customer: { select: { id: true, nome: true, telefone: true } } },
      orderBy: { dataHora: 'asc' },
    });
  }

  // ─── Availability ─────────────────────────────────────────────────────────
  // 11b.4: Calculate free slots for a given date, respecting service durations.
  // Business hours: 08:00–18:00. Each slot length = selected service duration (or 30 min default).
  async getAvailability(date: string, serviceId?: string) {
    const OPEN_HOUR  = 8;
    const CLOSE_HOUR = 18;
    const DEFAULT_DURATION = 30;

    let duration = DEFAULT_DURATION;
    if (serviceId) {
      const svc = await this.prisma.washService.findUnique({ where: { id: serviceId } });
      if (svc) duration = svc.duracaoMin;
    }

    // All non-cancelled schedules for the requested day, with their service durations
    const start = new Date(`${date}T00:00:00`);
    const end   = new Date(`${date}T23:59:59`);
    const existing = await this.prisma.washSchedule.findMany({
      where: { dataHora: { gte: start, lte: end }, status: { not: 'CANCELADO' } },
      include: { service: true },
    });

    const totalMinutes = (CLOSE_HOUR - OPEN_HOUR) * 60;
    const slots: {
      time: string;
      dateTime: string;
      available: boolean;
      conflictsWith?: string;
    }[] = [];

    for (let m = 0; m < totalMinutes; m += duration) {
      const absMinutes = OPEN_HOUR * 60 + m;
      const hour = Math.floor(absMinutes / 60);
      const min  = absMinutes % 60;
      const time = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
      const slotStart = new Date(`${date}T${time}:00`);
      const slotEnd   = new Date(slotStart.getTime() + duration * 60_000);

      const conflict = existing.find(s => {
        const sStart = new Date(s.dataHora);
        const sEnd   = new Date(sStart.getTime() + s.service.duracaoMin * 60_000);
        return slotStart < sEnd && slotEnd > sStart;
      });

      slots.push({
        time,
        dateTime: slotStart.toISOString(),
        available: !conflict,
        ...(conflict ? { conflictsWith: conflict.id } : {}),
      });
    }

    return { date, serviceId, duration, slots };
  }

  async createSchedule(dto: CreateScheduleDto) {
    if (!dto.customerId && !dto.nomeAvulso) {
      throw new BadRequestException('Informe customerId ou nomeAvulso');
    }
    const service = await this.prisma.washService.findUnique({ where: { id: dto.serviceId } });
    if (!service) throw new NotFoundException('Serviço não encontrado');

    return this.prisma.washSchedule.create({
      data: {
        customerId: dto.customerId,
        nomeAvulso: dto.nomeAvulso,
        telefone: dto.telefone,
        serviceId: dto.serviceId,
        dataHora: new Date(dto.dataHora),
        observacoes: dto.observacoes,
      },
      include: { service: true, customer: { select: { id: true, nome: true } } },
    });
  }

  async updateScheduleStatus(id: string, dto: UpdateScheduleDto) {
    const schedule = await this.prisma.washSchedule.findUnique({ where: { id } });
    if (!schedule) throw new NotFoundException('Agendamento não encontrado');

    const updated = await this.prisma.washSchedule.update({
      where: { id },
      data: dto,
      include: { service: { include: { products: { include: { product: true } } } } },
    });

    // Auto-debit stock when service is completed
    if (dto.status === WashScheduleStatus.CONCLUIDO) {
      await this.debitStock(id, updated.service.products);
    }

    return updated;
  }

  async cancelSchedule(id: string) {
    const schedule = await this.prisma.washSchedule.findUnique({ where: { id } });
    if (!schedule) throw new NotFoundException('Agendamento não encontrado');
    return this.prisma.washSchedule.update({
      where: { id },
      data: { status: 'CANCELADO' },
    });
  }

  // ─── Queue ────────────────────────────────────────────────────────────────

  async getQueue() {
    return this.prisma.washQueue.findMany({
      where: { status: { in: ['AGUARDANDO', 'EM_ATENDIMENTO'] } },
      include: { service: true, customer: { select: { id: true, nome: true } } },
      orderBy: { posicao: 'asc' },
    });
  }

  async addToQueue(dto: CreateQueueEntryDto) {
    if (!dto.customerId && !dto.nomeAvulso) {
      throw new BadRequestException('Informe customerId ou nomeAvulso');
    }
    const service = await this.prisma.washService.findUnique({ where: { id: dto.serviceId } });
    if (!service) throw new NotFoundException('Serviço não encontrado');

    // D2: Use serializable transaction to prevent duplicate queue positions
    const result = await this.prisma.$transaction(async (tx) => {
      const lastEntry = await tx.washQueue.findFirst({
        where: { status: { in: ['AGUARDANDO', 'EM_ATENDIMENTO'] } },
        orderBy: { posicao: 'desc' },
      });
      const posicao = (lastEntry?.posicao ?? 0) + 1;

      return tx.washQueue.create({
        data: {
          customerId: dto.customerId,
          nomeAvulso: dto.nomeAvulso,
          serviceId: dto.serviceId,
          veiculoPlaca: dto.veiculoPlaca,
          posicao,
        },
        include: { service: true, customer: { select: { id: true, nome: true } } },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    this.queueEvents.emit_queueChanged();
    return result;
  }

  async advanceQueue(id: string) {
    const entry = await this.prisma.washQueue.findUnique({
      where: { id },
      include: { service: { include: { products: { include: { product: true } } } } },
    });
    if (!entry) throw new NotFoundException('Entrada na fila não encontrada');

    let newStatus: WashQueueStatus;
    let concluidoAt: Date | undefined;

    if (entry.status === 'AGUARDANDO') {
      newStatus = 'EM_ATENDIMENTO';
    } else if (entry.status === 'EM_ATENDIMENTO') {
      newStatus = 'CONCLUIDO';
      concluidoAt = new Date();
      await this.debitStock(id, entry.service.products);
    } else {
      throw new BadRequestException('Entrada já concluída');
    }

    const result = await this.prisma.washQueue.update({
      where: { id },
      data: { status: newStatus, ...(concluidoAt && { concluidoAt }) },
      include: { service: true },
    });
    this.queueEvents.emit_queueChanged();
    return result;
  }

  async removeFromQueue(id: string) {
    const entry = await this.prisma.washQueue.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Entrada na fila não encontrada');
    const result = await this.prisma.washQueue.update({
      where: { id },
      data: { status: 'CONCLUIDO', concluidoAt: new Date() },
    });
    this.queueEvents.emit_queueChanged();
    return result;
  }

  async getAtendimentosDia(date?: string) {
    const target = date ? new Date(date) : new Date();
    target.setHours(0, 0, 0, 0);
    const end = new Date(target);
    end.setHours(23, 59, 59, 999);

    const [schedules, queues] = await Promise.all([
      this.prisma.washSchedule.findMany({
        where: { dataHora: { gte: target, lte: end }, status: 'CONCLUIDO' },
        include: { service: true, customer: { select: { id: true, nome: true } } },
      }),
      this.prisma.washQueue.findMany({
        where: { concluidoAt: { gte: target, lte: end } },
        include: { service: true, customer: { select: { id: true, nome: true } } },
      }),
    ]);

    return { schedules, queues };
  }

  // ─── Payments ─────────────────────────────────────────────────────────────

  async registerPayment(
    refType: 'WASH_SCHEDULE' | 'WASH_QUEUE',
    refId: string,
    dto: CreatePaymentDto,
  ) {
    // D5: Check for existing payment (idempotency) via unique scheduleId/queueId FK
    if (refType === 'WASH_SCHEDULE') {
      const existing = await this.prisma.payment.findUnique({ where: { scheduleId: refId } });
      if (existing) return existing;

      const s = await this.prisma.washSchedule.findUnique({
        where: { id: refId },
        include: { service: true },
      });
      if (!s) throw new NotFoundException('Agendamento não encontrado');
      return this.prisma.payment.create({
        data: {
          refType: 'WASH_SCHEDULE',
          scheduleId: refId,
          customerId: s.customerId,
          valor: s.service.preco,
          metodo: dto.metodo,
          status: 'CONFIRMADO',
          observacoes: dto.observacoes,
        },
      });
    } else {
      const existing = await this.prisma.payment.findUnique({ where: { queueId: refId } });
      if (existing) return existing;

      const q = await this.prisma.washQueue.findUnique({
        where: { id: refId },
        include: { service: true },
      });
      if (!q) throw new NotFoundException('Entrada na fila não encontrada');
      return this.prisma.payment.create({
        data: {
          refType: 'WASH_QUEUE',
          queueId: refId,
          customerId: q.customerId,
          valor: q.service.preco,
          metodo: dto.metodo,
          status: 'CONFIRMADO',
          observacoes: dto.observacoes,
        },
      });
    }
  }

  // ─── Stock auto-debit ─────────────────────────────────────────────────────

  // D1: Wrap ALL product debits in a single $transaction to prevent partial updates
  // Q5: Use proper Prisma Decimal types instead of any
  private async debitStock(
    refId: string,
    serviceProducts: Array<{
      productId: string;
      quantidadePorUso: Prisma.Decimal;
      product: { quantidadeAtual: Prisma.Decimal };
    }>,
  ) {
    if (!serviceProducts.length) return;

    await this.prisma.$transaction(async (tx) => {
      for (const sp of serviceProducts) {
        const current = await tx.product.findUnique({
          where: { id: sp.productId },
          select: { quantidadeAtual: true },
        });
        if (!current) continue;

        const currentQty = new Prisma.Decimal(current.quantidadeAtual);
        const debitQty = new Prisma.Decimal(sp.quantidadePorUso);
        const newQty = currentQty.sub(debitQty);
        if (newQty.lessThan(0)) continue; // don't go negative

        await tx.stockMovement.create({
          data: {
            productId: sp.productId,
            tipo: 'SAIDA',
            quantidade: debitQty,
            motivo: `Saída automática — atendimento ${refId}`,
          },
        });
        await tx.product.update({
          where: { id: sp.productId },
          data: { quantidadeAtual: newQty },
        });
      }
    });
  }
}

