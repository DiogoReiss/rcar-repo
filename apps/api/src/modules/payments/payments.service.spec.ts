import { PaymentsService } from './payments.service';
import { hmacSignature } from '../../common/webhooks/webhook-signature.util';

const SECRET = 'dev-payment-secret';

function makeService(
  overrides: {
    prisma?: unknown;
    audit?: unknown;
    notifications?: unknown;
    config?: unknown;
    gateway?: unknown;
  } = {},
) {
  return new PaymentsService(
    (overrides.prisma ?? {}) as never,
    (overrides.audit ?? { record: jest.fn() }) as never,
    (overrides.notifications ?? { notify: jest.fn() }) as never,
    (overrides.config ?? {
      get: (_k: string, def: string) => def,
    }) as never,
    (overrides.gateway ?? {}) as never,
  );
}

describe('PaymentsService', () => {
  const prisma = {
    payment: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(() => jest.clearAllMocks());

  it('returns paginated payment list', async () => {
    prisma.payment.findMany.mockResolvedValue([{ id: 'p1' }]);
    prisma.payment.count.mockResolvedValue(1);
    const service = makeService({ prisma });

    const result = await service.findAll({}, { page: 1, perPage: 20 });

    expect(result.total).toBe(1);
    expect(result.data).toHaveLength(1);
  });

  it('aggregates payment method summary', async () => {
    prisma.payment.findMany.mockResolvedValue([
      { metodo: 'PIX', valor: 10 },
      { metodo: 'PIX', valor: 20 },
      { metodo: 'DINHEIRO', valor: 5 },
    ]);
    const service = makeService({ prisma });

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
      const update = jest.fn();
      const prismaMock = {
        webhookEvent: { create: jest.fn().mockResolvedValue({}) },
        payment: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'p1',
            status: 'PENDENTE',
            valor: 50,
            metodo: 'PIX',
            pagarmeTxId: 'tx-1',
            customer: { nome: 'Ana', email: 'ana@x.com', telefone: null },
          }),
          update,
        },
      };
      const service = makeService({
        prisma: prismaMock,
        notifications: { notify },
      });

      const result = await service.handleWebhook(dto, goodSig);

      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'CONFIRMADO' } }),
      );
      expect(notify).toHaveBeenCalled();
      expect(result).toMatchObject({ status: 'CONFIRMADO' });
    });

    it('is idempotent on duplicate events', async () => {
      const update = jest.fn();
      const prismaMock = {
        webhookEvent: {
          create: jest.fn().mockRejectedValue(new Error('unique')),
        },
        payment: { findFirst: jest.fn(), update },
      };
      const service = makeService({ prisma: prismaMock });

      const result = await service.handleWebhook(dto, goodSig);

      expect(result).toMatchObject({ duplicate: true });
      expect(update).not.toHaveBeenCalled();
    });
  });
});
