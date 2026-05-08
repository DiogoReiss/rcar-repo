import { BadRequestException, NotFoundException } from '@nestjs/common';
import { LavajatoService } from './lavajato.service';

describe('LavajatoService', () => {
  const prisma = {
    washSchedule: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    washQueue: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    washService: {
      findUnique: jest.fn(),
    },
    payment: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const queueEvents = {
    emit_queueChanged: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws on schedule creation without customer or nomeAvulso', async () => {
    const service = new LavajatoService(prisma as never, queueEvents as never);

    await expect(
      service.createSchedule({
        serviceId: 'svc-1',
        dataHora: new Date().toISOString(),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('adds queue entry with next position and emits event', async () => {
    prisma.washService.findUnique.mockResolvedValue({ id: 'svc-1' });
    prisma.$transaction.mockImplementation(
      async (cb: (tx: any) => Promise<unknown>) =>
        cb({
          washQueue: {
            findFirst: jest.fn().mockResolvedValue({ posicao: 4 }),
            create: jest.fn().mockResolvedValue({
              id: 'q1',
              posicao: 5,
              status: 'AGUARDANDO',
            }),
          },
        }),
    );
    const service = new LavajatoService(prisma as never, queueEvents as never);

    const result = await service.addToQueue({
      serviceId: 'svc-1',
      nomeAvulso: 'Cliente Avulso',
    });

    expect(result).toEqual({ id: 'q1', posicao: 5, status: 'AGUARDANDO' });
    expect(queueEvents.emit_queueChanged).toHaveBeenCalled();
  });

  it('returns existing schedule payment on retry', async () => {
    prisma.payment.findUnique.mockResolvedValue({
      id: 'pay-1',
      scheduleId: 'sc-1',
    });
    const service = new LavajatoService(prisma as never, queueEvents as never);

    const result = await service.registerPayment('WASH_SCHEDULE', 'sc-1', {
      metodo: 'PIX',
    } as never);

    expect(prisma.payment.create).not.toHaveBeenCalled();
    expect(result).toEqual({ id: 'pay-1', scheduleId: 'sc-1' });
  });

  it('throws when queue entry does not exist for payment', async () => {
    prisma.payment.findUnique.mockResolvedValue(null);
    prisma.washQueue.findUnique.mockResolvedValue(null);
    const service = new LavajatoService(prisma as never, queueEvents as never);

    await expect(
      service.registerPayment('WASH_QUEUE', 'missing', {
        metodo: 'PIX',
      } as never),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
