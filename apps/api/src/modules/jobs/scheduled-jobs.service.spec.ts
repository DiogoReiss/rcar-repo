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

  const notifications = {
    notify: jest.fn(),
  };

  const billing = {
    runCycle: jest.fn().mockResolvedValue({
      processados: 0,
      faturas: 0,
      totalValor: 0,
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('enqueues low-stock alert when products are below minimum', async () => {
    prisma.$queryRaw.mockResolvedValue([
      { nome: 'Shampoo', quantidade_atual: 1, estoque_minimo: 5 },
    ]);
    const service = new ScheduledJobsService(
      prisma as never,
      emailQueue as never,
      notifications as never,
      billing as never,
    );

    await service.checkLowStock();

    expect(emailQueue.add).toHaveBeenCalledWith(
      'send',
      expect.objectContaining({
        subject: expect.stringContaining('estoque baixo'),
      }),
    );
  });

  it('sends daily reminders through the notifications service by preference', async () => {
    prisma.washSchedule.findMany.mockResolvedValue([
      {
        customer: {
          email: 'c@x.com',
          telefone: '+5511999999999',
          nome: 'Cliente',
          canalPreferido: 'WHATSAPP',
        },
        service: { nome: 'Lavagem Completa' },
      },
    ]);
    const service = new ScheduledJobsService(
      prisma as never,
      emailQueue as never,
      notifications as never,
      billing as never,
    );

    await service.sendDailyReminders();

    expect(notifications.notify).toHaveBeenCalledTimes(1);
    expect(notifications.notify).toHaveBeenCalledWith(
      'WHATSAPP',
      expect.objectContaining({
        recipient: expect.objectContaining({ phone: '+5511999999999' }),
      }),
    );
  });

  it('delegates recurring billing to the BillingService', async () => {
    const service = new ScheduledJobsService(
      prisma as never,
      emailQueue as never,
      notifications as never,
      billing as never,
    );

    await service.runRecurringBilling();

    expect(billing.runCycle).toHaveBeenCalledTimes(1);
  });
});
