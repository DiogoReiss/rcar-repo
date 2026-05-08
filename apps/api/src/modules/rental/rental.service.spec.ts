import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RentalService } from './rental.service';

describe('RentalService', () => {
  const prisma = {
    rentalContract: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    vehicle: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    payment: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
    inspection: { create: jest.fn() },
    contractIncident: { create: jest.fn() },
  };

  beforeEach(() => jest.clearAllMocks());

  it('rejects contract creation with invalid date interval', async () => {
    const service = new RentalService(prisma as never);

    await expect(
      service.create({
        customerId: 'c1',
        vehicleId: 'v1',
        modalidade: 'DIARIA',
        dataRetirada: '2026-05-10T10:00:00.000Z',
        dataDevolucao: '2026-05-10T09:00:00.000Z',
        valorDiaria: 100,
      } as never),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns existing confirmed payment (idempotent)', async () => {
    prisma.rentalContract.findUnique.mockResolvedValue({
      id: 'rc1',
      customerId: 'c1',
      valorTotal: 100,
      valorTotalReal: null,
    });
    prisma.payment.findFirst.mockResolvedValue({
      id: 'p1',
      status: 'CONFIRMADO',
    });
    const service = new RentalService(prisma as never);

    const result = await service.registerPayment('rc1', 'PIX');

    expect(prisma.payment.create).not.toHaveBeenCalled();
    expect(result).toEqual({ id: 'p1', status: 'CONFIRMADO' });
  });

  it('throws when canceling an active contract directly', async () => {
    prisma.rentalContract.findUnique.mockResolvedValue({
      id: 'rc1',
      status: 'ATIVO',
      vehicleId: 'v1',
    });
    const service = new RentalService(prisma as never);

    await expect(service.cancelContract('rc1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('throws when paying an unknown contract', async () => {
    prisma.rentalContract.findUnique.mockResolvedValue(null);
    const service = new RentalService(prisma as never);

    await expect(
      service.registerPayment('missing', 'PIX'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
