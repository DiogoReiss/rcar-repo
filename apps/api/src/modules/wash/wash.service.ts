import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateWashServiceDto } from './dto/create-wash-service.dto.js';
import { UpdateWashServiceDto } from './dto/update-wash-service.dto.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { WashRepository } from './wash.repository.js';

@Injectable()
export class WashService {
  constructor(private readonly repo: WashRepository) {}

  async findAll(includeInactive = false, pagination?: PaginationDto) {
    const { page = 1, perPage = 20 } = pagination ?? {};
    const safePage = Math.max(1, page);
    const { data, total } = await this.repo.listServices(
      includeInactive,
      (safePage - 1) * perPage,
      perPage,
    );
    return {
      data,
      total,
      page: safePage,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  async findAll_unbounded(includeInactive = false) {
    return this.repo.listAllServices(includeInactive);
  }

  async findOne(id: string) {
    const s = await this.repo.findServiceDetail(id);
    if (!s) throw new NotFoundException('Serviço não encontrado');
    return s;
  }

  async create(dto: CreateWashServiceDto) {
    return this.repo.createService(dto);
  }

  async update(id: string, dto: UpdateWashServiceDto) {
    await this.findOne(id);
    return this.repo.updateService(id, dto);
  }

  // Q11: Soft-delete wash service
  async remove(id: string) {
    await this.findOne(id);
    return this.repo.deactivateService(id);
  }
}
