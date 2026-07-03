import {
  Payment,
  PaymentMethod,
  Prisma,
  WashQueueStatus,
  WashScheduleStatus,
  WashService as WashServiceModel,
} from '@prisma/client';

/** Inclusive date range used to filter schedules/atendimentos. */
export interface DateRange {
  start: Date;
  end: Date;
}

export interface CreateScheduleData {
  customerId?: string;
  nomeAvulso?: string;
  telefone?: string;
  serviceId: string;
  dataHora: Date;
  observacoes?: string;
}

export interface UpdateScheduleData {
  status?: WashScheduleStatus;
  observacoes?: string;
}

export interface CreateQueueEntryData {
  customerId?: string;
  nomeAvulso?: string;
  serviceId: string;
  veiculoPlaca?: string;
}

export interface UpdateQueueStatusData {
  status: WashQueueStatus;
  concluidoAt?: Date;
}

export interface CreateWashPaymentData {
  refType: 'WASH_SCHEDULE' | 'WASH_QUEUE';
  scheduleId?: string;
  queueId?: string;
  customerId: string | null;
  valor: Prisma.Decimal.Value;
  metodo: PaymentMethod;
  observacoes?: string;
}

const scheduleListInclude = {
  service: true,
  customer: { select: { id: true, nome: true, telefone: true } },
} satisfies Prisma.WashScheduleInclude;

const scheduleSummaryInclude = {
  service: true,
  customer: { select: { id: true, nome: true } },
} satisfies Prisma.WashScheduleInclude;

const scheduleWithProductsInclude = {
  service: { include: { products: { include: { product: true } } } },
} satisfies Prisma.WashScheduleInclude;

const scheduleServiceInclude = {
  service: true,
} satisfies Prisma.WashScheduleInclude;

const queueSummaryInclude = {
  service: true,
  customer: { select: { id: true, nome: true } },
} satisfies Prisma.WashQueueInclude;

const queueWithProductsInclude = {
  service: { include: { products: { include: { product: true } } } },
} satisfies Prisma.WashQueueInclude;

const queueServiceInclude = {
  service: true,
} satisfies Prisma.WashQueueInclude;

export type ScheduleListItem = Prisma.WashScheduleGetPayload<{
  include: typeof scheduleListInclude;
}>;
export type ScheduleSummary = Prisma.WashScheduleGetPayload<{
  include: typeof scheduleSummaryInclude;
}>;
export type ScheduleWithProducts = Prisma.WashScheduleGetPayload<{
  include: typeof scheduleWithProductsInclude;
}>;
export type ScheduleWithService = Prisma.WashScheduleGetPayload<{
  include: typeof scheduleServiceInclude;
}>;
export type QueueSummary = Prisma.WashQueueGetPayload<{
  include: typeof queueSummaryInclude;
}>;
export type QueueWithProducts = Prisma.WashQueueGetPayload<{
  include: typeof queueWithProductsInclude;
}>;
export type QueueWithService = Prisma.WashQueueGetPayload<{
  include: typeof queueServiceInclude;
}>;

export const LAVAJATO_INCLUDES = {
  scheduleList: scheduleListInclude,
  scheduleSummary: scheduleSummaryInclude,
  scheduleWithProducts: scheduleWithProductsInclude,
  scheduleService: scheduleServiceInclude,
  queueSummary: queueSummaryInclude,
  queueWithProducts: queueWithProductsInclude,
  queueService: queueServiceInclude,
};

/**
 * Seam that centralizes every Prisma access for the lavajato module — wash
 * schedules, the walk-in queue and its atendimento payments. The
 * {@link LavajatoService} keeps the availability, slot and status-machine
 * business rules and talks only to this interface, so the storage adapter can
 * be swapped for an in-memory fake in tests and the service stays free of
 * scattered `prisma.*` calls, `.include()` chains and the serializable queue
 * transaction.
 */
export abstract class LavajatoRepository {
  // ─── Services ─────────────────────────────────────────────────────────────
  abstract findService(id: string): Promise<WashServiceModel | null>;

  // ─── Schedules ──────────────────────────────────────────────────────────
  abstract listSchedules(range?: DateRange): Promise<ScheduleListItem[]>;
  abstract listActiveSchedulesInRange(
    range: DateRange,
  ): Promise<ScheduleWithService[]>;
  abstract findSchedule(id: string): Promise<ScheduleSummary | null>;
  abstract createSchedule(data: CreateScheduleData): Promise<ScheduleSummary>;
  abstract updateSchedule(
    id: string,
    data: UpdateScheduleData,
  ): Promise<ScheduleWithProducts>;
  abstract cancelSchedule(id: string): Promise<ScheduleSummary>;

  // ─── Queue ────────────────────────────────────────────────────────────────
  abstract listActiveQueue(): Promise<QueueSummary[]>;
  /**
   * Appends an entry inside a serializable transaction that assigns the next
   * queue position atomically, preventing duplicate positions under
   * concurrency (D2).
   */
  abstract addToQueueExclusive(
    data: CreateQueueEntryData,
  ): Promise<QueueSummary>;
  abstract findQueueEntryWithProducts(
    id: string,
  ): Promise<QueueWithProducts | null>;
  abstract findQueueEntry(id: string): Promise<QueueWithService | null>;
  abstract updateQueueStatus(
    id: string,
    data: UpdateQueueStatusData,
  ): Promise<QueueWithService>;
  abstract completeQueueEntry(id: string): Promise<QueueWithService>;

  // ─── Atendimentos do dia ────────────────────────────────────────────────
  abstract listAtendimentosDia(range: DateRange): Promise<{
    schedules: ScheduleSummary[];
    queues: QueueSummary[];
  }>;

  // ─── Payments ─────────────────────────────────────────────────────────────
  abstract findPaymentBySchedule(scheduleId: string): Promise<Payment | null>;
  abstract findPaymentByQueue(queueId: string): Promise<Payment | null>;
  abstract findScheduleWithService(
    id: string,
  ): Promise<ScheduleWithService | null>;
  abstract findQueueWithService(id: string): Promise<QueueWithService | null>;
  abstract createWashPayment(data: CreateWashPaymentData): Promise<Payment>;
}
