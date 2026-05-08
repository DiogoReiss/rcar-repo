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


