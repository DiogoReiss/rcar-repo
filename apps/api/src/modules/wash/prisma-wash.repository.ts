import { Injectable } from '@nestjs/common';
import { WashService as WashServiceModel } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  CreateWashServiceData,
  UpdateWashServiceData,
  WASH_INCLUDES,
  WashRepository,
  WashServiceDetail,
} from './wash.repository.js';

/**
 * Prisma-backed {@link WashRepository}. All WashService catalog persistence for
 * the lavajato service module lives here.
 */
@Injectable()
export class PrismaWashRepository extends WashRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async listServices(
    includeInactive: boolean,
    skip: number,
    take: number,
  ): Promise<{ data: WashServiceModel[]; total: number }> {
    const where = includeInactive ? {} : { ativo: true };
    const [data, total] = await Promise.all([
      this.prisma.washService.findMany({
        where,
        orderBy: { nome: 'asc' },
        skip,
        take,
      }),
      this.prisma.washService.count({ where }),
    ]);
    return { data, total };
  }

  listAllServices(includeInactive: boolean): Promise<WashServiceModel[]> {
    return this.prisma.washService.findMany({
      where: includeInactive ? {} : { ativo: true },
      orderBy: { nome: 'asc' },
    });
  }

  findServiceDetail(id: string): Promise<WashServiceDetail | null> {
    return this.prisma.washService.findUnique({
      where: { id },
      include: WASH_INCLUDES.detail,
    });
  }

  createService(data: CreateWashServiceData): Promise<WashServiceModel> {
    return this.prisma.washService.create({ data });
  }

  updateService(
    id: string,
    data: UpdateWashServiceData,
  ): Promise<WashServiceModel> {
    return this.prisma.washService.update({ where: { id }, data });
  }

  deactivateService(id: string): Promise<WashServiceModel> {
    return this.prisma.washService.update({
      where: { id },
      data: { ativo: false },
    });
  }
}
