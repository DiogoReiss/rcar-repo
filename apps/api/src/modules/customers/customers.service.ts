import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateCustomerDto } from './dto/create-customer.dto.js';
import { UpdateCustomerDto } from './dto/update-customer.dto.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string, pagination?: PaginationDto) {
    const { page = 1, perPage = 20 } = pagination ?? {};
    const safePage = Math.max(1, page); // Q13: prevent page=0 causing negative skip
    const where: Prisma.CustomerWhereInput = {
      ativo: true,   // D4: consistently filter both ativo AND deletedAt
      deletedAt: null,
      ...(search && {
        OR: [
          { nome: { contains: search, mode: 'insensitive' } },
          { cpfCnpj: { contains: search } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };
    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        orderBy: { nome: 'asc' },
        skip: (safePage - 1) * perPage,
        take: perPage,
      }),
      this.prisma.customer.count({ where }),
    ]);
    return { data, total, page: safePage, perPage, totalPages: Math.ceil(total / perPage) };
  }

  async findOne(id: string) {
    const c = await this.prisma.customer.findUnique({ where: { id } });
    if (!c || c.deletedAt) throw new NotFoundException('Cliente não encontrado');
    return c;
  }

  async create(dto: CreateCustomerDto) {
    const existing = await this.prisma.customer.findUnique({ where: { cpfCnpj: dto.cpfCnpj } });
    if (existing) throw new ConflictException('CPF/CNPJ já cadastrado');
    return this.prisma.customer.create({ data: dto });
  }

  async update(id: string, dto: UpdateCustomerDto) {
    await this.findOne(id);
    return this.prisma.customer.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.customer.update({
      where: { id },
      data: { ativo: false, deletedAt: new Date() },
    });
  }
}

