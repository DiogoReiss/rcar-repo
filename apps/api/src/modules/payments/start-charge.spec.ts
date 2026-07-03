import { BadRequestException } from '@nestjs/common';
import { Payment } from '@prisma/client';
import { PaymentsService } from './payments.service';
import {
  CreatePendingPaymentData,
  PaymentAmount,
  PaymentsRepository,
  PaymentWithContact,
  PaymentWithCustomerDoc,
  PaymentWithCustomerRef,
} from './payments.repository';
import { FakePaymentGateway } from './fake-payment.gateway';

/**
 * In-memory {@link PaymentsRepository} adapter scoped to the startCharge path —
 * the seam lets PaymentsService run without Prisma or a database.
 */
class InMemoryPaymentsRepository extends PaymentsRepository {
  confirmedSum = 0;
  pendingPayment: Payment | null = null;
  created: CreatePendingPaymentData[] = [];

  sumConfirmed(): Promise<number> {
    return Promise.resolve(this.confirmedSum);
  }
  findPendingPayment(): Promise<Payment | null> {
    return Promise.resolve(this.pendingPayment);
  }
  createPendingPayment(data: CreatePendingPaymentData): Promise<Payment> {
    this.created.push(data);
    return Promise.resolve({
      id: 'pay1',
      status: 'PENDENTE',
      ...data,
    } as unknown as Payment);
  }
  findPaymentById(): Promise<Payment | null> {
    return Promise.resolve(null);
  }
  updatePaymentStatus(): Promise<Payment> {
    return Promise.resolve({} as Payment);
  }
  recordWebhookEvent(): Promise<boolean> {
    return Promise.resolve(true);
  }
  findPaymentByTxId(): Promise<PaymentWithContact | null> {
    return Promise.resolve(null);
  }
  findPaymentReceipt(): Promise<PaymentWithCustomerDoc | null> {
    return Promise.resolve(null);
  }
  listPayments(): Promise<{ data: Payment[]; total: number }> {
    return Promise.resolve({ data: [], total: 0 });
  }
  listPaymentAmounts(): Promise<PaymentAmount[]> {
    return Promise.resolve([]);
  }
  listPendingBefore(): Promise<PaymentWithCustomerRef[]> {
    return Promise.resolve([]);
  }
}

describe('PaymentsService.startCharge', () => {
  const makePayables = (customerName = 'Cliente') => ({
    resolve: jest.fn().mockResolvedValue({
      valor: 300,
      customerId: 'cust1',
      customerName,
      contractId: 'c1',
    }),
  });

  const audit = { record: jest.fn() };

  function makeService(repo: PaymentsRepository, payables: unknown) {
    return new PaymentsService(
      repo,
      audit as never,
      { notify: jest.fn() } as never,
      { get: (_k: string, def: string) => def } as never,
      new FakePaymentGateway(),
      payables as never,
    );
  }

  beforeEach(() => jest.clearAllMocks());

  it('creates a PENDENTE payment with external tx id (Pix happy path)', async () => {
    const repo = new InMemoryPaymentsRepository();
    const service = makeService(repo, makePayables());

    const result = await service.startCharge({
      refType: 'RENTAL_CONTRACT',
      refId: 'c1',
      metodo: 'PIX',
    });

    expect(result.status).toBe('PENDENTE');
    expect(result.pagarmeTxId).toMatch(/^fake-pix-/);
    expect((result as { pixQrCode?: string }).pixQrCode).toBeDefined();
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ acao: 'PAYMENT_CHARGE_STARTED' }),
    );
  });

  it('is idempotent — returns existing PENDENTE payment', async () => {
    const repo = new InMemoryPaymentsRepository();
    repo.pendingPayment = {
      id: 'existing',
      status: 'PENDENTE',
    } as unknown as Payment;
    const service = makeService(repo, makePayables());

    const result = await service.startCharge({
      refType: 'RENTAL_CONTRACT',
      refId: 'c1',
    });

    expect(result).toEqual({ id: 'existing', status: 'PENDENTE' });
    expect(repo.created).toHaveLength(0);
  });

  it('surfaces a clear error when the gateway refuses the charge', async () => {
    const repo = new InMemoryPaymentsRepository();
    const service = makeService(repo, makePayables('Cliente Recusa'));

    await expect(
      service.startCharge({ refType: 'RENTAL_CONTRACT', refId: 'c1' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.created).toHaveLength(0);
  });
});
