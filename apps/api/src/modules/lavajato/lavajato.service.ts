import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, WashQueueStatus, WashScheduleStatus } from '@prisma/client';
import { CreateScheduleDto } from './dto/create-schedule.dto.js';
import { UpdateScheduleDto } from './dto/update-schedule.dto.js';
import {
  CreateQueueEntryDto,
  CreatePaymentDto,
} from './dto/create-queue-entry.dto.js';
import { QueueEventsService } from './queue-events.service.js';
import { DomainEventsService } from '../../common/events/domain-events.service.js';
import {
  ATENDIMENTO_CONCLUIDO,
  AtendimentoConcluidoEvent,
} from './lavajato.events.js';
import { DateRange, LavajatoRepository } from './lavajato.repository.js';

@Injectable()
export class LavajatoService {
  constructor(
    private readonly repo: LavajatoRepository,
    private readonly queueEvents: QueueEventsService,
    private readonly events: DomainEventsService,
  ) {}

  // ─── Schedules ────────────────────────────────────────────────────────────

  async getSchedules(date?: string, month?: string) {
    return this.repo.listSchedules(this.resolveScheduleRange(date, month));
  }

  private resolveScheduleRange(
    date?: string,
    month?: string,
  ): DateRange | undefined {
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    if (month) {
      // month format: YYYY-MM
      const [y, m] = month.split('-').map(Number);
      const start = new Date(y, m - 1, 1, 0, 0, 0, 0);
      const end = new Date(y, m, 0, 23, 59, 59, 999);
      return { start, end };
    }
    return undefined;
  }

  // ─── Availability ─────────────────────────────────────────────────────────
  // 11b.4: Calculate free slots for a given date, respecting service durations.
  // Business hours: 08:00–18:00. Each slot length = selected service duration (or 30 min default).
  async getAvailability(date: string, serviceId?: string) {
    const OPEN_HOUR = 8;
    const CLOSE_HOUR = 18;
    const DEFAULT_DURATION = 30;

    let duration = DEFAULT_DURATION;
    if (serviceId) {
      const svc = await this.repo.findService(serviceId);
      if (svc) duration = svc.duracaoMin;
    }

    // All non-cancelled schedules for the requested day, with their service durations
    const start = new Date(`${date}T00:00:00`);
    const end = new Date(`${date}T23:59:59`);
    const existing = await this.repo.listActiveSchedulesInRange({ start, end });

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
      const min = absMinutes % 60;
      const time = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
      const slotStart = new Date(`${date}T${time}:00`);
      const slotEnd = new Date(slotStart.getTime() + duration * 60_000);

      const conflict = existing.find((s) => {
        const sStart = new Date(s.dataHora);
        const sEnd = new Date(sStart.getTime() + s.service.duracaoMin * 60_000);
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
    const service = await this.repo.findService(dto.serviceId);
    if (!service) throw new NotFoundException('Serviço não encontrado');

    return this.repo.createSchedule({
      customerId: dto.customerId,
      nomeAvulso: dto.nomeAvulso,
      telefone: dto.telefone,
      serviceId: dto.serviceId,
      dataHora: new Date(dto.dataHora),
      observacoes: dto.observacoes,
    });
  }

  async updateScheduleStatus(id: string, dto: UpdateScheduleDto) {
    const schedule = await this.repo.findSchedule(id);
    if (!schedule) throw new NotFoundException('Agendamento não encontrado');

    const updated = await this.repo.updateSchedule(id, dto);

    // Emit AtendimentoConcluido — stock deduction is the inventory module's concern.
    if (dto.status === WashScheduleStatus.CONCLUIDO) {
      this.emitAtendimentoConcluido(id, updated.service.products);
    }

    return updated;
  }

  async cancelSchedule(id: string) {
    const schedule = await this.repo.findSchedule(id);
    if (!schedule) throw new NotFoundException('Agendamento não encontrado');
    return this.repo.cancelSchedule(id);
  }

  // ─── Queue ────────────────────────────────────────────────────────────────

  async getQueue() {
    return this.repo.listActiveQueue();
  }

  async addToQueue(dto: CreateQueueEntryDto) {
    if (!dto.customerId && !dto.nomeAvulso) {
      throw new BadRequestException('Informe customerId ou nomeAvulso');
    }
    const service = await this.repo.findService(dto.serviceId);
    if (!service) throw new NotFoundException('Serviço não encontrado');

    // D2: Serializable position assignment lives in the repository.
    const result = await this.repo.addToQueueExclusive({
      customerId: dto.customerId,
      nomeAvulso: dto.nomeAvulso,
      serviceId: dto.serviceId,
      veiculoPlaca: dto.veiculoPlaca,
    });
    this.queueEvents.emit_queueChanged();
    return result;
  }

  async advanceQueue(id: string) {
    const entry = await this.repo.findQueueEntryWithProducts(id);
    if (!entry) throw new NotFoundException('Entrada na fila não encontrada');

    let newStatus: WashQueueStatus;
    let concluidoAt: Date | undefined;
    let concluido = false;

    if (entry.status === 'AGUARDANDO') {
      newStatus = 'EM_ATENDIMENTO';
    } else if (entry.status === 'EM_ATENDIMENTO') {
      newStatus = 'CONCLUIDO';
      concluidoAt = new Date();
      concluido = true;
    } else {
      throw new BadRequestException('Entrada já concluída');
    }

    const result = await this.repo.updateQueueStatus(id, {
      status: newStatus,
      concluidoAt,
    });
    if (concluido) {
      this.emitAtendimentoConcluido(id, entry.service.products);
    }
    this.queueEvents.emit_queueChanged();
    return result;
  }

  async removeFromQueue(id: string) {
    const entry = await this.repo.findQueueEntry(id);
    if (!entry) throw new NotFoundException('Entrada na fila não encontrada');
    const result = await this.repo.completeQueueEntry(id);
    this.queueEvents.emit_queueChanged();
    return result;
  }

  async getAtendimentosDia(date?: string) {
    const target = date ? new Date(date) : new Date();
    target.setHours(0, 0, 0, 0);
    const end = new Date(target);
    end.setHours(23, 59, 59, 999);

    return this.repo.listAtendimentosDia({ start: target, end });
  }

  // ─── Payments ─────────────────────────────────────────────────────────────

  async registerPayment(
    refType: 'WASH_SCHEDULE' | 'WASH_QUEUE',
    refId: string,
    dto: CreatePaymentDto,
  ) {
    // D5: Check for existing payment (idempotency) via unique scheduleId/queueId FK
    if (refType === 'WASH_SCHEDULE') {
      const existing = await this.repo.findPaymentBySchedule(refId);
      if (existing) return existing;

      const s = await this.repo.findScheduleWithService(refId);
      if (!s) throw new NotFoundException('Agendamento não encontrado');
      return this.repo.createWashPayment({
        refType: 'WASH_SCHEDULE',
        scheduleId: refId,
        customerId: s.customerId,
        valor: s.service.preco,
        metodo: dto.metodo,
        observacoes: dto.observacoes,
      });
    } else {
      const existing = await this.repo.findPaymentByQueue(refId);
      if (existing) return existing;

      const q = await this.repo.findQueueWithService(refId);
      if (!q) throw new NotFoundException('Entrada na fila não encontrada');
      return this.repo.createWashPayment({
        refType: 'WASH_QUEUE',
        queueId: refId,
        customerId: q.customerId,
        valor: q.service.preco,
        metodo: dto.metodo,
        observacoes: dto.observacoes,
      });
    }
  }

  // ─── Stock auto-debit (via domain event) ──────────────────────────────────

  private emitAtendimentoConcluido(
    refId: string,
    serviceProducts: Array<{
      productId: string;
      quantidadePorUso: Prisma.Decimal;
    }>,
  ) {
    if (!serviceProducts.length) return;
    this.events.publish<AtendimentoConcluidoEvent>(ATENDIMENTO_CONCLUIDO, {
      refId,
      items: serviceProducts.map((sp) => ({
        productId: sp.productId,
        quantidade: sp.quantidadePorUso.toString(),
      })),
    });
  }
}
