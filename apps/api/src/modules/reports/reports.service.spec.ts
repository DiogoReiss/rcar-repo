import { ReportsService } from './reports.service';

function createPrismaMock() {
  return {
    washSchedule: { findMany: jest.fn().mockResolvedValue([]) },
    washQueue: { findMany: jest.fn().mockResolvedValue([]) },
    payment: { findMany: jest.fn().mockResolvedValue([]) },
    stockMovement: { findMany: jest.fn().mockResolvedValue([]) },
  };
}

describe('ReportsService charts period', () => {
  it('uses 7d by default for invalid period', async () => {
    const prisma = createPrismaMock();
    const service = new ReportsService(prisma as never);

    const data = await service.getChartsData('invalid');

    expect(data.weeklyServices.labels).toHaveLength(7);
    expect(data.incomeOutcome.labels).toHaveLength(7);
  });

  it('returns 30 labels for 30d period', async () => {
    const prisma = createPrismaMock();
    const service = new ReportsService(prisma as never);

    const data = await service.getChartsData('30d');

    expect(data.weeklyServices.labels).toHaveLength(30);
  });

  it('returns labels from start of month to today', async () => {
    const prisma = createPrismaMock();
    const service = new ReportsService(prisma as never);

    const data = await service.getChartsData('month');

    const expectedLength = new Date().getDate();
    expect(data.weeklyServices.labels).toHaveLength(expectedLength);
  });
});

describe('ReportsService recurring revenue', () => {
  it('sums active cycle amounts, normalizes MRR and flags upcoming cycles', async () => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 2);
    const prisma = {
      masterAgreement: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'a1',
            ciclo: 'MENSAL',
            proximoCiclo: soon,
            customer: { id: 'c1', nome: 'Cliente 1' },
            items: [{ valorCiclo: 1000, vehicleId: 'v1' }],
          },
          {
            id: 'a2',
            ciclo: 'SEMANAL',
            proximoCiclo: new Date('2030-01-01'),
            customer: { id: 'c2', nome: 'Cliente 2' },
            items: [{ valorCiclo: 100, vehicleId: 'v2' }],
          },
        ]),
      },
    };
    const service = new ReportsService(prisma as never);

    const data = await service.getRecurringRevenue(7);

    expect(data.acordosAtivos).toBe(2);
    expect(data.porCiclo.MENSAL).toBe(1000);
    expect(data.porCiclo.SEMANAL).toBe(100);
    // MRR = 1000 + 100 * (52/12)
    expect(data.receitaRecorrenteMensal).toBeCloseTo(1433.33, 1);
    // only the agreement due within 7 days is alerted
    expect(data.alertaProximoVencimento.total).toBe(1);
    expect(data.alertaProximoVencimento.data[0].agreementId).toBe('a1');
  });
});
