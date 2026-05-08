import { ScheduledJobsService } from './scheduled-jobs.service';

describe('ScheduledJobsService', () => {
  const prisma = {
    $queryRaw: jest.fn(),
    washSchedule: {
      findMany: jest.fn(),
    },
  };

  const emailQueue = {
    add: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('enqueues low-stock alert when products are below minimum', async () => {
    prisma.$queryRaw.mockResolvedValue([{ nome: 'Shampoo', quantidade_atual: 1, estoque_minimo: 5 }]);
    const service = new ScheduledJobsService(prisma as never, emailQueue as never);

    await service.checkLowStock();

    expect(emailQueue.add).toHaveBeenCalledWith(
      'send',
      expect.objectContaining({
        subject: expect.stringContaining('estoque baixo'),
      }),
    );
  });

  it('enqueues daily reminders for schedules with customer email', async () => {
    prisma.washSchedule.findMany.mockResolvedValue([
      {
        customer: { email: 'c@x.com', nome: 'Cliente' },
        service: { nome: 'Lavagem Completa' },
      },
      {
        customer: { email: null, nome: 'Sem Email' },
        service: { nome: 'Lavagem Simples' },
      },
    ]);
    const service = new ScheduledJobsService(prisma as never, emailQueue as never);

    await service.sendDailyReminders();

    expect(emailQueue.add).toHaveBeenCalledTimes(1);
    expect(emailQueue.add).toHaveBeenCalledWith(
      'send',
      expect.objectContaining({ to: 'c@x.com' }),
    );
  });
});

