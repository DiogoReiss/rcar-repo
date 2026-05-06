import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateWashServiceDto } from './dto/create-wash-service.dto.js';
import { UpdateWashServiceDto } from './dto/update-wash-service.dto.js';

@Injectable()
export class WashService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(includeInactive = false) {
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
}

