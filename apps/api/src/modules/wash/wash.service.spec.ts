import { NotFoundException } from '@nestjs/common';
import { WashService as WashServiceModel } from '@prisma/client';
import { WashService } from './wash.service';
import {
  CreateWashServiceData,
  UpdateWashServiceData,
  WashRepository,
  WashServiceDetail,
} from './wash.repository';

/**
 * In-memory {@link WashRepository} adapter — the seam makes WashService testable
 * without Prisma mocks. Only the behavior exercised by these specs is
 * implemented; unused reads return empty results.
 */
class InMemoryWashRepository extends WashRepository {
  services = new Map<string, WashServiceModel>();
  listResult: { data: WashServiceModel[]; total: number } = {
    data: [],
    total: 0,
  };
  lastListArgs?: { includeInactive: boolean; skip: number; take: number };

  seed(service: WashServiceModel): void {
    this.services.set(service.id, service);
  }

  listServices(includeInactive: boolean, skip: number, take: number) {
    this.lastListArgs = { includeInactive, skip, take };
    return Promise.resolve(this.listResult);
  }
  listAllServices(): Promise<WashServiceModel[]> {
    return Promise.resolve([...this.services.values()]);
  }
  findServiceDetail(id: string): Promise<WashServiceDetail | null> {
    const s = this.services.get(id);
    return Promise.resolve((s as unknown as WashServiceDetail) ?? null);
  }
  createService(data: CreateWashServiceData): Promise<WashServiceModel> {
    const created = { id: 'created', ...data } as unknown as WashServiceModel;
    this.services.set(created.id, created);
    return Promise.resolve(created);
  }
  updateService(
    id: string,
    data: UpdateWashServiceData,
  ): Promise<WashServiceModel> {
    const updated = {
      ...(this.services.get(id) as object),
      ...data,
    } as WashServiceModel;
    this.services.set(id, updated);
    return Promise.resolve(updated);
  }
  deactivateService(id: string): Promise<WashServiceModel> {
    const updated = {
      ...(this.services.get(id) as object),
      ativo: false,
    } as WashServiceModel;
    this.services.set(id, updated);
    return Promise.resolve(updated);
  }
}

describe('WashService', () => {
  let repo: InMemoryWashRepository;
  let service: WashService;

  beforeEach(() => {
    repo = new InMemoryWashRepository();
    service = new WashService(repo);
  });

  it('returns paginated active services by default', async () => {
    repo.listResult = {
      data: [{ id: 's1', nome: 'Lavagem' } as WashServiceModel],
      total: 1,
    };

    const result = await service.findAll(false, { page: 2, perPage: 10 });

    expect(repo.lastListArgs).toEqual({
      includeInactive: false,
      skip: 10,
      take: 10,
    });
    expect(result.totalPages).toBe(1);
  });

  it('throws when service is not found', async () => {
    await expect(service.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('soft-deletes an existing service', async () => {
    repo.seed({ id: 's1', nome: 'Lavagem', ativo: true } as WashServiceModel);

    const result = await service.remove('s1');

    expect(result.ativo).toBe(false);
  });
});
