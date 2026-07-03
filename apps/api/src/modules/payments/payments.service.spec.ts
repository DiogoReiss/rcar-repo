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
import { hmacSignature } from '../../common/webhooks/webhook-signature.util';

const SECRET = 'dev-payment-secret';

/**
 * In-memory {@link PaymentsRepository} adapter — the seam makes PaymentsService
 * testable without Prisma mocks. Reads return configured fixtures; writes are
 * recorded so specs can assert on them.
 */
class InMemoryPaymentsRepository extends PaymentsRepository {
  confirmedSum = 0;
  pendingPayment: Payment | null = null;
  paymentById: Payment | null = null;
  paymentByTxId: PaymentWithContact | null = null;
  paymentReceipt: PaymentWithCustomerDoc | null = null;
  duplicateWebhook = false;
  listResult: { data: Payment[]; total: number } = { data: [], total: 0 };
  amounts: PaymentAmount[] = [];
  pendingBefore: PaymentWithCustomerRef[] = [];

  created: CreatePendingPaymentData[] = [];
  statusUpdates: Array<{ id: string; status: string }> = [];

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
    return Promise.resolve(this.paymentById);
  }
  updatePaymentStatus(id: string, status: string): Promise<Payment> {
    this.statusUpdates.push({ id, status });
    return Promise.resolve({
      ...(this.paymentById as object),
      id,
      status,
    } as Payment);
  }
  recordWebhookEvent(): Promise<boolean> {
    return Promise.resolve(!this.duplicateWebhook);
  }
  findPaymentByTxId(): Promise<PaymentWithContact | null> {
    return Promise.resolve(this.paymentByTxId);
  }
  findPaymentReceipt(): Promise<PaymentWithCustomerDoc | null> {
    return Promise.resolve(this.paymentReceipt);
  }
  listPayments(): Promise<{ data: Payment[]; total: number }> {
    return Promise.resolve(this.listResult);
  }
  listPaymentAmounts(): Promise<PaymentAmount[]> {
    return Promise.resolve(this.amounts);
  }
  listPendingBefore(): Promise<PaymentWithCustomerRef[]> {
    return Promise.resolve(this.pendingBefore);
  }
}

function makeService(
  overrides: {
    repo?: PaymentsRepository;
    audit?: unknown;
    notifications?: unknown;
    config?: unknown;
    gateway?: unknown;
    payables?: unknown;
  } = {},
) {
  return new PaymentsService(
    overrides.repo ?? new InMemoryPaymentsRepository(),
    (overrides.audit ?? { record: jest.fn() }) as never,
    (overrides.notifications ?? { notify: jest.fn() }) as never,
    (overrides.config ?? {
      get: (_k: string, def: string) => def,
    }) as never,
    (overrides.gateway ?? {}) as never,
    (overrides.payables ?? { resolve: jest.fn() }) as never,
  );
}

describe('PaymentsService', () => {
  it('returns paginated payment list', async () => {
    const repo = new InMemoryPaymentsRepository();
    repo.listResult = { data: [{ id: 'p1' } as Payment], total: 1 };
    const service = makeService({ repo });

    const result = await service.findAll({}, { page: 1, perPage: 20 });

    expect(result.total).toBe(1);
    expect(result.data).toHaveLength(1);
  });

  it('aggregates payment method summary', async () => {
    const repo = new InMemoryPaymentsRepository();
    repo.amounts = [
      { metodo: 'PIX', valor: 10 },
      { metodo: 'PIX', valor: 20 },
      { metodo: 'DINHEIRO', valor: 5 },
    ] as unknown as PaymentAmount[];
    const service = makeService({ repo });

    const result = await service.methodSummary({});

    const pix = result.data.find((item) => item.metodo === 'PIX');
    expect(pix?.quantidade).toBe(2);
    expect(pix?.valor).toBe(30);
    expect(result.totalQuantidade).toBe(3);
  });

  describe('handleWebhook', () => {
    const dto = {
      eventId: 'evt-1',
      externalId: 'tx-1',
      status: 'CONFIRMED' as const,
    };
    const goodSig = hmacSignature(
      SECRET,
      `${dto.eventId}.${dto.externalId}.${dto.status}`,
    );

    it('rejects an invalid signature', async () => {
      const service = makeService();
      await expect(service.handleWebhook(dto, 'bad')).rejects.toThrow();
    });

    it('confirms the payment and emails a receipt', async () => {
      const notify = jest.fn();
      const repo = new InMemoryPaymentsRepository();
      repo.paymentByTxId = {
        id: 'p1',
        status: 'PENDENTE',
        valor: 50,
        metodo: 'PIX',
        pagarmeTxId: 'tx-1',
        customer: { nome: 'Ana', email: 'ana@x.com', telefone: null },
      } as unknown as PaymentWithContact;
      const service = makeService({ repo, notifications: { notify } });

      const result = await service.handleWebhook(dto, goodSig);

      expect(repo.statusUpdates).toEqual([{ id: 'p1', status: 'CONFIRMADO' }]);
      expect(notify).toHaveBeenCalled();
      expect(result).toMatchObject({ status: 'CONFIRMADO' });
    });

    it('is idempotent on duplicate events', async () => {
      const repo = new InMemoryPaymentsRepository();
      repo.duplicateWebhook = true;
      const service = makeService({ repo });

      const result = await service.handleWebhook(dto, goodSig);

      expect(result).toMatchObject({ duplicate: true });
      expect(repo.statusUpdates).toHaveLength(0);
    });
  });

  describe('getBalance', () => {
    it('computes total, pago and saldo from confirmed payments', async () => {
      const repo = new InMemoryPaymentsRepository();
      repo.confirmedSum = 120;
      const payables = {
        resolve: jest.fn().mockResolvedValue({
          valor: 300,
          customerId: 'cust1',
          customerName: 'Cliente',
          contractId: 'c1',
        }),
      };
      const service = makeService({ repo, payables });

      const balance = await service.getBalance('RENTAL_CONTRACT', 'c1');

      expect(payables.resolve).toHaveBeenCalledWith('RENTAL_CONTRACT', 'c1');
      expect(balance).toMatchObject({
        total: 300,
        pago: 120,
        saldo: 180,
        quitado: false,
      });
    });
  });

  describe('refundCharge', () => {
    it('refunds a confirmed payment via the gateway', async () => {
      const refund = jest.fn();
      const repo = new InMemoryPaymentsRepository();
      repo.paymentById = {
        id: 'p1',
        status: 'CONFIRMADO',
        pagarmeTxId: 'tx-1',
      } as unknown as Payment;
      const service = makeService({ repo, gateway: { refund } });

      const result = await service.refundCharge('p1');

      expect(refund).toHaveBeenCalledWith('tx-1');
      expect(result.status).toBe('CANCELADO');
    });

    it('rejects refunding a non-confirmed payment', async () => {
      const repo = new InMemoryPaymentsRepository();
      repo.paymentById = { id: 'p1', status: 'PENDENTE' } as unknown as Payment;
      const service = makeService({ repo });

      await expect(service.refundCharge('p1')).rejects.toThrow();
    });
  });
});
