import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuditService } from '../../common/audit/audit.service.js';
import {
  CreateMasterAgreementDto,
  LinkVehicleDto,
} from './dto/master-agreement.dto.js';

interface ActingUser {
  id?: string;
  role?: string;
}

@Injectable()
export class MasterAgreementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateMasterAgreementDto, user?: ActingUser) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
      select: { id: true },
    });
    if (!customer) throw new NotFoundException('Cliente não encontrado');

    const agreement = await this.prisma.masterAgreement.create({
      data: {
        customerId: dto.customerId,
        descricao: dto.descricao,
        ciclo: dto.ciclo,
        diaVencimento: dto.diaVencimento,
        items: dto.items?.length
          ? {
              create: dto.items.map((item) => ({
                vehicleId: item.vehicleId,
                contractId: item.contractId,
                valorCiclo: new Prisma.Decimal(item.valorCiclo),
              })),
            }
          : undefined,
      },
      include: { items: true },
    });

    await this.audit.record({
      userId: user?.id ?? null,
      acao: 'MASTER_AGREEMENT_CREATED',
      entidade: 'MasterAgreement',
      entidadeId: agreement.id,
      detalhes: {
        customerId: dto.customerId,
        ciclo: dto.ciclo,
        itens: agreement.items.length,
      },
    });

    return agreement;
  }

  findAll() {
    return this.prisma.masterAgreement.findMany({
      include: {
        customer: { select: { id: true, nome: true, cpfCnpj: true } },
        items: { where: { ativo: true }, select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const agreement = await this.prisma.masterAgreement.findUnique({
      where: { id },
      include: {
        customer: true,
        items: {
          include: {
            vehicle: { select: { id: true, placa: true, modelo: true } },
          },
          orderBy: { vinculadoEm: 'asc' },
        },
      },
    });
    if (!agreement) throw new NotFoundException('Acordo não encontrado');
    return agreement;
  }

  async linkVehicle(id: string, dto: LinkVehicleDto, user?: ActingUser) {
    await this.ensureActive(id);

    const item = await this.prisma.masterAgreementItem.create({
      data: {
        agreementId: id,
        vehicleId: dto.vehicleId,
        contractId: dto.contractId,
        valorCiclo: new Prisma.Decimal(dto.valorCiclo),
      },
    });

    await this.audit.record({
      userId: user?.id ?? null,
      acao: 'MASTER_AGREEMENT_VEHICLE_LINKED',
      entidade: 'MasterAgreement',
      entidadeId: id,
      detalhes: { itemId: item.id, vehicleId: dto.vehicleId },
    });

    return item;
  }

  /**
   * Unlinks a vehicle by soft-closing its item (ativo=false + desvinculadoEm),
   * preserving the financial history for vehicle swaps.
   */
  async unlinkVehicle(id: string, itemId: string, user?: ActingUser) {
    const item = await this.prisma.masterAgreementItem.findFirst({
      where: { id: itemId, agreementId: id },
    });
    if (!item) throw new NotFoundException('Item do acordo não encontrado');
    if (!item.ativo) return item;

    const updated = await this.prisma.masterAgreementItem.update({
      where: { id: itemId },
      data: { ativo: false, desvinculadoEm: new Date() },
    });

    await this.audit.record({
      userId: user?.id ?? null,
      acao: 'MASTER_AGREEMENT_VEHICLE_UNLINKED',
      entidade: 'MasterAgreement',
      entidadeId: id,
      detalhes: { itemId, vehicleId: item.vehicleId },
    });

    return updated;
  }

  /** Financial breakdown traceable per vehicle and per cycle. */
  async apuracao(id: string) {
    const agreement = await this.prisma.masterAgreement.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!agreement) throw new NotFoundException('Acordo não encontrado');

    const perVehicle = new Map<
      string,
      { vehicleId: string; ativos: number; total: number; historico: number }
    >();
    for (const item of agreement.items) {
      const row = perVehicle.get(item.vehicleId) ?? {
        vehicleId: item.vehicleId,
        ativos: 0,
        total: 0,
        historico: 0,
      };
      if (item.ativo) {
        row.ativos += 1;
        row.total += Number(item.valorCiclo);
      } else {
        row.historico += 1;
      }
      perVehicle.set(item.vehicleId, row);
    }

    const valorCicloAtual = agreement.items
      .filter((i) => i.ativo)
      .reduce((acc, i) => acc + Number(i.valorCiclo), 0);

    return {
      agreementId: agreement.id,
      ciclo: agreement.ciclo,
      valorCicloAtual,
      veiculosAtivos: [...perVehicle.values()].filter((v) => v.ativos > 0)
        .length,
      porVeiculo: [...perVehicle.values()],
    };
  }

  private async ensureActive(id: string) {
    const agreement = await this.prisma.masterAgreement.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!agreement) throw new NotFoundException('Acordo não encontrado');
    if (agreement.status !== 'ATIVO') {
      throw new BadRequestException('Acordo não está ativo');
    }
    return agreement;
  }
}
