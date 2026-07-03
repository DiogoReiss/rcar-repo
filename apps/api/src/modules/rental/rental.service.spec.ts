import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { RentalService } from './rental.service';
import { DomainEventsService } from '../../common/events/domain-events.service';
import { CONTRATO_FECHADO, ContratoFechadoEvent } from './rental.events';
import {
  ContractDetail,
  CreateConfirmedPaymentData,
  CreateContractData,
  RentalRepository,
} from './rental.repository';

type StoredContract = {
  id: string;
  status: string;
  vehicleId: string;
  customerId: string;
  valorTotal: Prisma.Decimal;
  valorTotalReal: Prisma.Decimal | null;
  valorDiaria: Prisma.Decimal;
  seguro: boolean;
  valorSeguro: Prisma.Decimal | null;
  dataRetirada: Date;
  assinaturaObrigatoria: boolean;
  d4signStatus: string | null;
};

/**
 * In-memory {@link RentalRepository} adapter — the seam makes RentalService
 * testable without Prisma mocks. Only the behavior exercised by these specs is
 * implemented; unused reads return empty results.
 */
class InMemoryRentalRepository extends RentalRepository {
  contracts = new Map<string, StoredContract>();
  confirmedPayments = new Map<string, { id: string; status: string }>();
  created: CreateConfirmedPaymentData[] = [];
  conflictOnCreate = false;

  seed(contract: StoredContract): void {
    this.contracts.set(contract.id, contract);
  }

  findBusyVehicleIds(): Promise<string[]> {
    return Promise.resolve([]);
  }
  findAvailableVehicles(): Promise<never[]> {
    return Promise.resolve([]);
  }
  listContracts() {
    return Promise.resolve({ data: [], total: 0 });
  }
  findContractDetail(id: string): Promise<ContractDetail | null> {
    const c = this.contracts.get(id);
    return Promise.resolve((c as unknown as ContractDetail) ?? null);
  }
  findContract(id: string) {
    const c = this.contracts.get(id);
    return Promise.resolve(
      (c as unknown as Prisma.RentalContractGetPayload<object>) ?? null,
    );
  }
  createContractExclusive(data: CreateContractData) {
    if (this.conflictOnCreate) return Promise.resolve(null);
    const summary = { id: 'new', ...data };
    return Promise.resolve(summary as never);
  }
  applyOpen(id: string) {
    const c = this.contracts.get(id);
    if (c) c.status = 'ATIVO';
    return Promise.resolve();
  }
  applyClose(id: string) {
    const c = this.contracts.get(id);
    if (c) c.status = 'ENCERRADO';
    return Promise.resolve();
  }
  applyCancel(id: string) {
    const c = this.contracts.get(id);
    if (c) c.status = 'CANCELADO';
    return Promise.resolve();
  }
  findConfirmedContractPayment(contractId: string) {
    return Promise.resolve(this.confirmedPayments.get(contractId) ?? null);
  }
  createConfirmedPayment(data: CreateConfirmedPaymentData) {
    this.created.push(data);
    return Promise.resolve({ id: 'pay-new', ...data } as never);
  }
}

function activeContract(
  overrides: Partial<StoredContract> = {},
): StoredContract {
  return {
    id: 'rc1',
    status: 'ATIVO',
    vehicleId: 'v1',
    customerId: 'c1',
    valorTotal: new Prisma.Decimal(100),
    valorTotalReal: null,
    valorDiaria: new Prisma.Decimal(50),
    seguro: false,
    valorSeguro: null,
    dataRetirada: new Date('2026-05-01T10:00:00.000Z'),
    assinaturaObrigatoria: false,
    d4signStatus: null,
    ...overrides,
  };
}

describe('RentalService', () => {
  let repo: InMemoryRentalRepository;
  let events: DomainEventsService;
  let service: RentalService;

  beforeEach(() => {
    repo = new InMemoryRentalRepository();
    events = new DomainEventsService();
    service = new RentalService(repo, events);
  });

  it('rejects contract creation with invalid date interval', async () => {
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
    repo.seed(activeContract());
    repo.confirmedPayments.set('rc1', { id: 'p1', status: 'CONFIRMADO' });

    const result = await service.registerPayment('rc1', 'PIX');

    expect(repo.created).toHaveLength(0);
    expect(result).toEqual({ id: 'p1', status: 'CONFIRMADO' });
  });

  it('throws when canceling an active contract directly', async () => {
    repo.seed(activeContract({ status: 'ATIVO' }));

    await expect(service.cancelContract('rc1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('throws when paying an unknown contract', async () => {
    await expect(
      service.registerPayment('missing', 'PIX'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('emits ContratoFechado after closing a contract', async () => {
    repo.seed(activeContract());
    const received: ContratoFechadoEvent[] = [];
    events.subscribe<ContratoFechadoEvent>(CONTRATO_FECHADO, (e) =>
      received.push(e),
    );

    await service.closeContract('rc1', { kmDevolucao: 1000 });

    expect(received).toEqual([{ contractId: 'rc1' }]);
    expect(repo.contracts.get('rc1')?.status).toBe('ENCERRADO');
  });

  it('does not emit when close is a no-op on an already-closed contract', async () => {
    repo.seed(activeContract({ status: 'ENCERRADO' }));
    const emit = jest.spyOn(events, 'publish');

    await service.closeContract('rc1', { kmDevolucao: 1000 });

    expect(emit).not.toHaveBeenCalled();
  });
});
