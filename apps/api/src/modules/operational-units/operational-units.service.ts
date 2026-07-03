import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuditService } from '../../common/audit/audit.service.js';
import {
  unitScopeWhere,
  type UnitScopedUser,
} from '../../common/scope/unit-scope.js';
import {
  CreateOperationalUnitDto,
  UpdateOperationalUnitDto,
} from './dto/operational-unit.dto.js';

interface ActingUser extends UnitScopedUser {
  id?: string;
}

@Injectable()
export class OperationalUnitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateOperationalUnitDto, user?: ActingUser) {
    const unit = await this.prisma.operationalUnit.create({
      data: {
        nome: dto.nome,
        codigo: dto.codigo,
        endereco: dto.endereco as Prisma.InputJsonValue | undefined,
      },
    });
    await this.audit.record({
      userId: user?.id,
      acao: 'OPERATIONAL_UNIT_CREATED',
      entidade: 'OperationalUnit',
      entidadeId: unit.id,
      detalhes: { codigo: unit.codigo },
    });
    return unit;
  }

  /**
   * Lists units. A GESTOR_GERAL sees all units; a scoped user only sees the
   * unit they belong to.
   */
  findAll(user?: ActingUser) {
    const scope = unitScopeWhere(user);
    const where =
      scope.unidadeId !== undefined
        ? { id: scope.unidadeId, deletedAt: null }
        : { deletedAt: null };
    return this.prisma.operationalUnit.findMany({
      where,
      orderBy: { nome: 'asc' },
    });
  }

  async findOne(id: string) {
    const unit = await this.prisma.operationalUnit.findFirst({
      where: { id, deletedAt: null },
    });
    if (!unit)
      throw new NotFoundException('Unidade operacional não encontrada');
    return unit;
  }

  async update(id: string, dto: UpdateOperationalUnitDto, user?: ActingUser) {
    await this.findOne(id);
    const unit = await this.prisma.operationalUnit.update({
      where: { id },
      data: {
        nome: dto.nome,
        endereco: dto.endereco as Prisma.InputJsonValue | undefined,
        ativo: dto.ativo,
      },
    });
    await this.audit.record({
      userId: user?.id,
      acao: 'OPERATIONAL_UNIT_UPDATED',
      entidade: 'OperationalUnit',
      entidadeId: unit.id,
    });
    return unit;
  }
}
