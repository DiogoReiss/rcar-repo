import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateWashServiceDto } from './dto/create-wash-service.dto.js';
import { UpdateWashServiceDto } from './dto/update-wash-service.dto.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';

@Injectable()
export class WashService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(includeInactive = false, pagination?: PaginationDto) {
    const { page = 1, perPage = 20 } = pagination ?? {};
    const safePage = Math.max(1, page);
    const where = includeInactive ? {} : { ativo: true };
    const [data, total] = await Promise.all([
      this.prisma.washService.findMany({
        where,
        orderBy: { nome: 'asc' },
        skip: (safePage - 1) * perPage,
        take: perPage,
      }),
      this.prisma.washService.count({ where }),
    ]);
    return {
      data,
      total,
      page: safePage,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  async findAll_unbounded(includeInactive = false) {
    return this.prisma.washService.findMany({
      where: includeInactive ? {} : { ativo: true },
      orderBy: { nome: 'asc' },
    });
  }

  async findOne(id: string) {
    const s = await this.prisma.washService.findUnique({
      where: { id },
      include: { products: { include: { product: true } } },
    });
    if (!s) throw new NotFoundException('Serviço não encontrado');
    return s;
  }

  async create(dto: CreateWashServiceDto) {
    return this.prisma.washService.create({ data: dto });
  }

  async update(id: string, dto: UpdateWashServiceDto) {
    await this.findOne(id);
    return this.prisma.washService.update({ where: { id }, data: dto });
  }

  // Q11: Soft-delete wash service
  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.washService.update({
      where: { id },
      data: { ativo: false },
    });
  }
}
