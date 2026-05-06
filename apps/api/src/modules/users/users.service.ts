import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly select = {
    id: true, nome: true, email: true, role: true, ativo: true,
    createdAt: true, updatedAt: true,
  } as const;

  async findAll() {
    return this.prisma.user.findMany({
      where: { ativo: true, deletedAt: null }, // D4: filter both ativo AND deletedAt
      select: this.select,
      orderBy: { nome: 'asc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: this.select,
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('E-mail já cadastrado');

    const senhaHash = await bcrypt.hash(dto.senha, 12); // S8: consistent 12 rounds
    return this.prisma.user.create({
      data: { nome: dto.nome, email: dto.email, senhaHash, role: dto.role },
      select: this.select,
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);
    const data: Record<string, unknown> = { ...dto };
    if (dto.senha) {
      data.senhaHash = await bcrypt.hash(dto.senha, 12); // S8: consistent 12 rounds
      delete data.senha;
    }
    return this.prisma.user.update({ where: { id }, data, select: this.select });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: { ativo: false, deletedAt: new Date() },
      select: this.select,
    });
  }
}

