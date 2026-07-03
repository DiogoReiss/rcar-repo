import { Injectable } from '@nestjs/common';
import {
  Payment,
  Prisma,
  WashService as WashServiceModel,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  CreateQueueEntryData,
  CreateScheduleData,
  CreateWashPaymentData,
  DateRange,
  LAVAJATO_INCLUDES,
  LavajatoRepository,
  QueueSummary,
  QueueWithProducts,
  QueueWithService,
  ScheduleListItem,
  ScheduleSummary,
  ScheduleWithProducts,
  ScheduleWithService,
  UpdateQueueStatusData,
  UpdateScheduleData,
} from './lavajato.repository.js';

/**
 * Prisma-backed {@link LavajatoRepository}. Owns all WashSchedule / WashQueue /
 * Payment persistence for the lavajato module, including the serializable
 * next-position transaction for the walk-in queue.
 */
@Injectable()
export class PrismaLavajatoRepository extends LavajatoRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  findService(id: string): Promise<WashServiceModel | null> {
    return this.prisma.washService.findUnique({ where: { id } });
  }

  // ─── Schedules ──────────────────────────────────────────────────────────

  listSchedules(range?: DateRange): Promise<ScheduleListItem[]> {
    const where: Prisma.WashScheduleWhereInput = range
      ? { dataHora: { gte: range.start, lte: range.end } }
      : {};
    return this.prisma.washSchedule.findMany({
      where,
      include: LAVAJATO_INCLUDES.scheduleList,
      orderBy: { dataHora: 'asc' },
    });
  }

  listActiveSchedulesInRange(range: DateRange): Promise<ScheduleWithService[]> {
    return this.prisma.washSchedule.findMany({
      where: {
        dataHora: { gte: range.start, lte: range.end },
        status: { not: 'CANCELADO' },
      },
      include: LAVAJATO_INCLUDES.scheduleService,
    });
  }

  findSchedule(id: string): Promise<ScheduleSummary | null> {
    return this.prisma.washSchedule.findUnique({
      where: { id },
      include: LAVAJATO_INCLUDES.scheduleSummary,
    });
  }

  createSchedule(data: CreateScheduleData): Promise<ScheduleSummary> {
    return this.prisma.washSchedule.create({
      data: {
        customerId: data.customerId,
        nomeAvulso: data.nomeAvulso,
        telefone: data.telefone,
        serviceId: data.serviceId,
        dataHora: data.dataHora,
        observacoes: data.observacoes,
      },
      include: LAVAJATO_INCLUDES.scheduleSummary,
    });
  }

  updateSchedule(
    id: string,
    data: UpdateScheduleData,
  ): Promise<ScheduleWithProducts> {
    return this.prisma.washSchedule.update({
      where: { id },
      data,
      include: LAVAJATO_INCLUDES.scheduleWithProducts,
    });
  }

  cancelSchedule(id: string): Promise<ScheduleSummary> {
    return this.prisma.washSchedule.update({
      where: { id },
      data: { status: 'CANCELADO' },
      include: LAVAJATO_INCLUDES.scheduleSummary,
    });
  }

  // ─── Queue ────────────────────────────────────────────────────────────────

  listActiveQueue(): Promise<QueueSummary[]> {
    return this.prisma.washQueue.findMany({
      where: { status: { in: ['AGUARDANDO', 'EM_ATENDIMENTO'] } },
      include: LAVAJATO_INCLUDES.queueSummary,
      orderBy: { posicao: 'asc' },
    });
  }

  addToQueueExclusive(data: CreateQueueEntryData): Promise<QueueSummary> {
    // D2: serializable transaction prevents duplicate queue positions.
    return this.prisma.$transaction(
      async (tx) => {
        const lastEntry = await tx.washQueue.findFirst({
          where: { status: { in: ['AGUARDANDO', 'EM_ATENDIMENTO'] } },
          orderBy: { posicao: 'desc' },
        });
        const posicao = (lastEntry?.posicao ?? 0) + 1;

        return tx.washQueue.create({
          data: {
            customerId: data.customerId,
            nomeAvulso: data.nomeAvulso,
            serviceId: data.serviceId,
            veiculoPlaca: data.veiculoPlaca,
            posicao,
          },
          include: LAVAJATO_INCLUDES.queueSummary,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  findQueueEntryWithProducts(id: string): Promise<QueueWithProducts | null> {
    return this.prisma.washQueue.findUnique({
      where: { id },
      include: LAVAJATO_INCLUDES.queueWithProducts,
    });
  }

  findQueueEntry(id: string): Promise<QueueWithService | null> {
    return this.prisma.washQueue.findUnique({
      where: { id },
      include: LAVAJATO_INCLUDES.queueService,
    });
  }

  updateQueueStatus(
    id: string,
    data: UpdateQueueStatusData,
  ): Promise<QueueWithService> {
    return this.prisma.washQueue.update({
      where: { id },
      data: {
        status: data.status,
        ...(data.concluidoAt && { concluidoAt: data.concluidoAt }),
      },
      include: LAVAJATO_INCLUDES.queueService,
    });
  }

  completeQueueEntry(id: string): Promise<QueueWithService> {
    return this.prisma.washQueue.update({
      where: { id },
      data: { status: 'CONCLUIDO', concluidoAt: new Date() },
      include: LAVAJATO_INCLUDES.queueService,
    });
  }

  // ─── Atendimentos do dia ────────────────────────────────────────────────

  async listAtendimentosDia(range: DateRange): Promise<{
    schedules: ScheduleSummary[];
    queues: QueueSummary[];
  }> {
    const [schedules, queues] = await Promise.all([
      this.prisma.washSchedule.findMany({
        where: {
          dataHora: { gte: range.start, lte: range.end },
          status: 'CONCLUIDO',
        },
        include: LAVAJATO_INCLUDES.scheduleSummary,
      }),
      this.prisma.washQueue.findMany({
        where: { concluidoAt: { gte: range.start, lte: range.end } },
        include: LAVAJATO_INCLUDES.queueSummary,
      }),
    ]);
    return { schedules, queues };
  }

  // ─── Payments ─────────────────────────────────────────────────────────────

  findPaymentBySchedule(scheduleId: string): Promise<Payment | null> {
    return this.prisma.payment.findUnique({ where: { scheduleId } });
  }

  findPaymentByQueue(queueId: string): Promise<Payment | null> {
    return this.prisma.payment.findUnique({ where: { queueId } });
  }

  findScheduleWithService(id: string): Promise<ScheduleWithService | null> {
    return this.prisma.washSchedule.findUnique({
      where: { id },
      include: LAVAJATO_INCLUDES.scheduleService,
    });
  }

  findQueueWithService(id: string): Promise<QueueWithService | null> {
    return this.prisma.washQueue.findUnique({
      where: { id },
      include: LAVAJATO_INCLUDES.queueService,
    });
  }

  createWashPayment(data: CreateWashPaymentData): Promise<Payment> {
    return this.prisma.payment.create({
      data: {
        refType: data.refType,
        scheduleId: data.scheduleId,
        queueId: data.queueId,
        customerId: data.customerId,
        valor: data.valor,
        metodo: data.metodo,
        status: 'CONFIRMADO',
        observacoes: data.observacoes,
      },
    });
  }
}
