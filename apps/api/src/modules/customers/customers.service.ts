import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateCustomerDto } from './dto/create-customer.dto.js';
import { UpdateCustomerDto } from './dto/update-customer.dto.js';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string) {
    const where: Prisma.CustomerWhereInput = {
      deletedAt: null,
      ...(search && {
        OR: [
          { nome: { contains: search, mode: 'insensitive' } },
          { cpfCnpj: { contains: search } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };
    return this.prisma.customer.findMany({ where, orderBy: { nome: 'asc' } });
  }

  async findOne(id: string) {
    const c = await this.prisma.customer.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Cliente não encontrado');
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

