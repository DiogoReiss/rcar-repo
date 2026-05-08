import { PaymentsService } from './payments.service';

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
    const service = new PaymentsService(prisma as never);

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
    const service = new PaymentsService(prisma as never);

    const result = await service.methodSummary({});

    const pix = result.data.find((item) => item.metodo === 'PIX');
    expect(pix?.quantidade).toBe(2);
    expect(pix?.valor).toBe(30);
    expect(result.totalQuantidade).toBe(3);
  });
});
