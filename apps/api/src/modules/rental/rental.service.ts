import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Prisma, ContractStatus, PaymentMethod } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateContractDto } from './dto/create-contract.dto.js';
import {
  OpenContractDto,
  CloseContractDto,
} from './dto/contract-operations.dto.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';

@Injectable()
export class RentalService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Availability ─────────────────────────────────────────────────────────

  async checkAvailability(dataRetirada: string, dataDevolucao: string) {
    const start = new Date(dataRetirada);
    const end = new Date(dataDevolucao);

    // Find vehicle IDs already booked in this period
    const busyContracts = await this.prisma.rentalContract.findMany({
      where: {
        status: { in: ['RESERVADO', 'ATIVO'] },
        AND: [{ dataRetirada: { lt: end } }, { dataDevolucao: { gt: start } }],
      },
      select: { vehicleId: true },
    });

    const busyIds = busyContracts.map((c) => c.vehicleId);

    const available = await this.prisma.vehicle.findMany({
      where: {
        status: 'DISPONIVEL',
        deletedAt: null,
        id: { notIn: busyIds },
      },
      orderBy: { modelo: 'asc' },
    });

    return available;
  }

  // ─── Contracts ────────────────────────────────────────────────────────────

  async findAll(
    status?: ContractStatus,
    customerId?: string,
    pagination?: PaginationDto,
  ) {
    const { page = 1, perPage = 20 } = pagination ?? {};
    const safePage = Math.max(1, page);
    const where: Prisma.RentalContractWhereInput = {
      ...(status && { status }),
      ...(customerId && { customerId }),
    };
    const [data, total] = await Promise.all([
      this.prisma.rentalContract.findMany({
        where,
        include: {
          customer: { select: { id: true, nome: true, cpfCnpj: true } },
          vehicle: { select: { id: true, placa: true, modelo: true } },
        },
        orderBy: { dataRetirada: 'desc' },
        skip: (safePage - 1) * perPage,
        take: perPage,
      }),
      this.prisma.rentalContract.count({ where }),
    ]);
    return {
      data,
      total,
      page: safePage,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  async findOne(id: string) {
    const c = await this.prisma.rentalContract.findUnique({
      where: { id },
      include: {
        customer: true,
        vehicle: true,
        inspections: { orderBy: { createdAt: 'asc' } },
        incidents: true,
        payments: true,
      },
    });
    if (!c) throw new NotFoundException('Contrato não encontrado');
    return c;
  }

  async create(dto: CreateContractDto) {
    const start = new Date(dto.dataRetirada);
    const end = new Date(dto.dataDevolucao);

    if (start >= end)
      throw new BadRequestException(
        'Data de devolução deve ser posterior à retirada',
      );

    // D3: Wrap availability check + create in a serializable transaction to prevent double booking
    return this.prisma.$transaction(
      async (tx) => {
        const conflict = await tx.rentalContract.findFirst({
          where: {
            vehicleId: dto.vehicleId,
            status: { in: ['RESERVADO', 'ATIVO'] },
            AND: [
              { dataRetirada: { lt: end } },
              { dataDevolucao: { gt: start } },
            ],
          },
        });
        if (conflict)
          throw new ConflictException(
            'Veículo indisponível para o período selecionado',
          );

        const diffMs = end.getTime() - start.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        const valorTotal = new Prisma.Decimal(dto.valorDiaria)
          .mul(diffDays)
          .add(
            dto.seguro && dto.valorSeguro
              ? new Prisma.Decimal(dto.valorSeguro)
              : 0,
          );

        return tx.rentalContract.create({
          data: {
            customerId: dto.customerId,
            vehicleId: dto.vehicleId,
            modalidade: dto.modalidade,
            dataRetirada: start,
            dataDevolucao: end,
            valorDiaria: dto.valorDiaria,
            valorTotal,
            seguro: dto.seguro ?? false,
            valorSeguro: dto.valorSeguro,
            kmLimite: dto.kmLimite,
            observacoes: dto.observacoes,
          },
          include: {
            customer: { select: { id: true, nome: true } },
            vehicle: { select: { id: true, placa: true, modelo: true } },
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  // ─── Open contract (vistoria de saída) ───────────────────────────────────

  async openContract(id: string, dto: OpenContractDto) {
    const contract = await this.prisma.rentalContract.findUnique({
      where: { id },
    });
    if (!contract) throw new NotFoundException('Contrato não encontrado');
    // D8: Re-read status inside the transaction to avoid partially-applied state on concurrent calls
    if (contract.status === 'ATIVO') return this.findOne(id); // already open — idempotent
    if (contract.status !== 'RESERVADO')
      throw new BadRequestException('Contrato não está em status RESERVADO');

    await this.prisma.$transaction([
      this.prisma.rentalContract.update({
        where: { id },
        data: {
          status: 'ATIVO',
          kmRetirada: dto.kmRetirada,
          combustivelSaida: dto.combustivelSaida,
        },
      }),
      this.prisma.vehicle.update({
        where: { id: contract.vehicleId },
        data: { status: 'ALUGADO' },
      }),
      ...(dto.checklist
        ? [
            this.prisma.inspection.create({
              data: {
                contractId: id,
                tipo: 'SAIDA',
                checklist: (dto.checklist ?? {}) as Prisma.JsonObject,
                fotos: [],
              },
            }),
          ]
        : []),
    ]);

    return this.findOne(id);
  }

  // ─── Close contract (vistoria de chegada + devolução) ────────────────────

  async closeContract(id: string, dto: CloseContractDto) {
    const contract = await this.prisma.rentalContract.findUnique({
      where: { id },
    });
    if (!contract) throw new NotFoundException('Contrato não encontrado');
    // D7: Guard against double-close — idempotent retry safety (must come before status check)
    if (contract.status === 'ENCERRADO') return this.findOne(id);
    if (contract.status !== 'ATIVO')
      throw new BadRequestException('Contrato não está ATIVO');

    const now = new Date();
    const diffMs = now.getTime() - contract.dataRetirada.getTime();
    const diffDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    const valorReal = new Prisma.Decimal(contract.valorDiaria)
      .mul(diffDays)
      .add(contract.seguro && contract.valorSeguro ? contract.valorSeguro : 0);

    const incidents = dto.incidents ?? [];
    const incidentesCobrados = incidents.filter(
      (i) => i.cobradoCliente !== false,
    );
    const totalIncidentesCobrados = incidentesCobrados.reduce(
      (a, i) => a + Number(i.valor ?? 0),
      0,
    );
    const valorRealFinal = valorReal.add(
      new Prisma.Decimal(totalIncidentesCobrados),
    );

    const incidentCreates = incidents.map((incident) =>
      this.prisma.contractIncident.create({
        data: {
          contractId: id,
          tipo: incident.tipo as Prisma.ContractIncidentUncheckedCreateInput['tipo'],
          descricao: incident.descricao,
          valor: new Prisma.Decimal(incident.valor ?? 0),
          cobradoCliente: incident.cobradoCliente ?? true,
          fotos: [],
          data: now,
        },
      }),
    );

    await this.prisma.$transaction([
      this.prisma.rentalContract.update({
        where: { id },
        data: {
          status: 'ENCERRADO',
          dataDevReal: now,
          kmDevolucao: dto.kmDevolucao,
          combustivelChegada: dto.combustivelChegada,
          valorTotalReal: valorRealFinal,
          observacoes: dto.observacoes,
        },
      }),
      this.prisma.vehicle.update({
        where: { id: contract.vehicleId },
        data: { status: 'DISPONIVEL', kmAtual: dto.kmDevolucao },
      }),
      ...(dto.checklist
        ? [
            this.prisma.inspection.create({
              data: {
                contractId: id,
                tipo: 'CHEGADA',
                checklist: (dto.checklist ?? {}) as Prisma.JsonObject,
                fotos: [],
              },
            }),
          ]
        : []),
      ...incidentCreates,
    ]);

    return this.findOne(id);
  }

  async cancelContract(id: string) {
    const contract = await this.prisma.rentalContract.findUnique({
      where: { id },
    });
    if (!contract) throw new NotFoundException('Contrato não encontrado');
    if (contract.status === 'ATIVO')
      throw new BadRequestException(
        'Contratos ativos não podem ser cancelados direto; use devolução',
      );

    await this.prisma.$transaction([
      this.prisma.rentalContract.update({
        where: { id },
        data: { status: 'CANCELADO' },
      }),
      this.prisma.vehicle.update({
        where: { id: contract.vehicleId },
        data: { status: 'DISPONIVEL' },
      }),
    ]);
    return this.findOne(id);
  }

  async registerPayment(contractId: string, metodo: PaymentMethod) {
    const contract = await this.prisma.rentalContract.findUnique({
      where: { id: contractId },
    });
    if (!contract) throw new NotFoundException('Contrato não encontrado');

    // D6: Idempotency — return existing payment if already registered (client retry safety)
    const existing = await this.prisma.payment.findFirst({
      where: { contractId, status: 'CONFIRMADO' },
    });
    if (existing) return existing;

    return this.prisma.payment.create({
      data: {
        refType: 'RENTAL_CONTRACT',
        contractId,
        customerId: contract.customerId,
        valor: contract.valorTotalReal ?? contract.valorTotal,
        metodo,
        status: 'CONFIRMADO',
      },
    });
  }
}
