import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Payment, WashService as WashServiceModel } from '@prisma/client';
import { LavajatoService } from './lavajato.service';
import {
  CreateScheduleData,
  CreateWashPaymentData,
  LavajatoRepository,
  QueueSummary,
  QueueWithProducts,
  QueueWithService,
  ScheduleListItem,
  ScheduleSummary,
  ScheduleWithProducts,
  ScheduleWithService,
} from './lavajato.repository';

/**
 * In-memory {@link LavajatoRepository} adapter — the seam makes LavajatoService
 * testable without Prisma mocks or a database. Only the behavior exercised by
 * these specs is implemented; unused reads return empty results.
 */
class InMemoryLavajatoRepository extends LavajatoRepository {
  services = new Map<string, WashServiceModel>();
  schedulePayments = new Map<string, Payment>();
  queuePayments = new Map<string, Payment>();
  queueWithService = new Map<string, QueueWithService>();
  nextQueueEntry?: QueueSummary;
  createdPayments: CreateWashPaymentData[] = [];

  seedService(service: WashServiceModel): void {
    this.services.set(service.id, service);
  }

  findService(id: string): Promise<WashServiceModel | null> {
    return Promise.resolve(this.services.get(id) ?? null);
  }

  listSchedules(): Promise<ScheduleListItem[]> {
    return Promise.resolve([]);
  }
  listActiveSchedulesInRange(): Promise<ScheduleWithService[]> {
    return Promise.resolve([]);
  }
  findSchedule(): Promise<ScheduleSummary | null> {
    return Promise.resolve(null);
  }
  createSchedule(data: CreateScheduleData): Promise<ScheduleSummary> {
    return Promise.resolve({
      id: 'sched',
      ...data,
    } as unknown as ScheduleSummary);
  }
  updateSchedule(): Promise<ScheduleWithProducts> {
    return Promise.resolve({
      service: { products: [] },
    } as unknown as ScheduleWithProducts);
  }
  cancelSchedule(): Promise<ScheduleSummary> {
    return Promise.resolve({} as ScheduleSummary);
  }

  listActiveQueue(): Promise<QueueSummary[]> {
    return Promise.resolve([]);
  }
  addToQueueExclusive(): Promise<QueueSummary> {
    return Promise.resolve(this.nextQueueEntry as QueueSummary);
  }
  findQueueEntryWithProducts(): Promise<QueueWithProducts | null> {
    return Promise.resolve(null);
  }
  findQueueEntry(id: string): Promise<QueueWithService | null> {
    return Promise.resolve(this.queueWithService.get(id) ?? null);
  }
  updateQueueStatus(): Promise<QueueWithService> {
    return Promise.resolve({} as QueueWithService);
  }
  completeQueueEntry(): Promise<QueueWithService> {
    return Promise.resolve({} as QueueWithService);
  }

  listAtendimentosDia(): Promise<{
    schedules: ScheduleSummary[];
    queues: QueueSummary[];
  }> {
    return Promise.resolve({ schedules: [], queues: [] });
  }

  findPaymentBySchedule(scheduleId: string): Promise<Payment | null> {
    return Promise.resolve(this.schedulePayments.get(scheduleId) ?? null);
  }
  findPaymentByQueue(queueId: string): Promise<Payment | null> {
    return Promise.resolve(this.queuePayments.get(queueId) ?? null);
  }
  findScheduleWithService(): Promise<ScheduleWithService | null> {
    return Promise.resolve(null);
  }
  findQueueWithService(): Promise<QueueWithService | null> {
    return Promise.resolve(null);
  }
  createWashPayment(data: CreateWashPaymentData): Promise<Payment> {
    this.createdPayments.push(data);
    return Promise.resolve({ id: 'created', ...data } as unknown as Payment);
  }
}

describe('LavajatoService', () => {
  let repo: InMemoryLavajatoRepository;
  const queueEvents = { emit_queueChanged: jest.fn() };
  const domainEvents = { publish: jest.fn(), subscribe: jest.fn() };

  function makeService() {
    return new LavajatoService(
      repo,
      queueEvents as never,
      domainEvents as never,
    );
  }

  beforeEach(() => {
    repo = new InMemoryLavajatoRepository();
    jest.clearAllMocks();
  });

  it('throws on schedule creation without customer or nomeAvulso', async () => {
    const service = makeService();

    await expect(
      service.createSchedule({
        serviceId: 'svc-1',
        dataHora: new Date().toISOString(),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('adds queue entry with next position and emits event', async () => {
    repo.seedService({ id: 'svc-1' } as WashServiceModel);
    repo.nextQueueEntry = {
      id: 'q1',
      posicao: 5,
      status: 'AGUARDANDO',
    } as unknown as QueueSummary;
    const service = makeService();

    const result = await service.addToQueue({
      serviceId: 'svc-1',
      nomeAvulso: 'Cliente Avulso',
    });

    expect(result).toEqual({ id: 'q1', posicao: 5, status: 'AGUARDANDO' });
    expect(queueEvents.emit_queueChanged).toHaveBeenCalled();
  });

  it('returns existing schedule payment on retry', async () => {
    repo.schedulePayments.set('sc-1', {
      id: 'pay-1',
      scheduleId: 'sc-1',
    } as unknown as Payment);
    const service = makeService();

    const result = await service.registerPayment('WASH_SCHEDULE', 'sc-1', {
      metodo: 'PIX',
    } as never);

    expect(repo.createdPayments).toHaveLength(0);
    expect(result).toEqual({ id: 'pay-1', scheduleId: 'sc-1' });
  });

  it('throws when queue entry does not exist for payment', async () => {
    const service = makeService();

    await expect(
      service.registerPayment('WASH_QUEUE', 'missing', {
        metodo: 'PIX',
      } as never),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
