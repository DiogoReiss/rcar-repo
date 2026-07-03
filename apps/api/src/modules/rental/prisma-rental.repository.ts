import { Injectable } from '@nestjs/common';
import { Prisma, Vehicle } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  CloseContractData,
  ContractDetail,
  ContractListItem,
  ContractSummary,
  CreateConfirmedPaymentData,
  CreateContractData,
  OpenContractData,
  RENTAL_INCLUDES,
  RentalRepository,
} from './rental.repository.js';

/**
 * Prisma-backed {@link RentalRepository}. All RentalContract / Vehicle /
 * Inspection / Incident / Payment persistence for the Contrato module lives
 * here, including the serializable booking transaction and the open/close
 * atomic state transitions.
 */
@Injectable()
export class PrismaRentalRepository extends RentalRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findBusyVehicleIds(start: Date, end: Date): Promise<string[]> {
    const busy = await this.prisma.rentalContract.findMany({
      where: {
        status: { in: ['RESERVADO', 'ATIVO'] },
        AND: [{ dataRetirada: { lt: end } }, { dataDevolucao: { gt: start } }],
      },
      select: { vehicleId: true },
    });
    return busy.map((c) => c.vehicleId);
  }

  findAvailableVehicles(excludeIds: string[]): Promise<Vehicle[]> {
    return this.prisma.vehicle.findMany({
      where: {
        status: 'DISPONIVEL',
        deletedAt: null,
        id: { notIn: excludeIds },
      },
      orderBy: { modelo: 'asc' },
    });
  }

  async listContracts(
    status: Prisma.RentalContractWhereInput['status'],
    customerId: string | undefined,
    skip: number,
    take: number,
  ): Promise<{ data: ContractListItem[]; total: number }> {
    const where: Prisma.RentalContractWhereInput = {
      ...(status && { status }),
      ...(customerId && { customerId }),
    };
    const [data, total] = await Promise.all([
      this.prisma.rentalContract.findMany({
        where,
        include: RENTAL_INCLUDES.list,
        orderBy: { dataRetirada: 'desc' },
        skip,
        take,
      }),
      this.prisma.rentalContract.count({ where }),
    ]);
    return { data, total };
  }

  findContractDetail(id: string): Promise<ContractDetail | null> {
    return this.prisma.rentalContract.findUnique({
      where: { id },
      include: RENTAL_INCLUDES.detail,
    });
  }

  findContract(id: string) {
    return this.prisma.rentalContract.findUnique({ where: { id } });
  }

  createContractExclusive(
    data: CreateContractData,
  ): Promise<ContractSummary | null> {
    return this.prisma.$transaction(
      async (tx) => {
        const conflict = await tx.rentalContract.findFirst({
          where: {
            vehicleId: data.vehicleId,
            status: { in: ['RESERVADO', 'ATIVO'] },
            AND: [
              { dataRetirada: { lt: data.dataDevolucao } },
              { dataDevolucao: { gt: data.dataRetirada } },
            ],
          },
        });
        if (conflict) return null;

        return tx.rentalContract.create({
          data: {
            customerId: data.customerId,
            vehicleId: data.vehicleId,
            modalidade: data.modalidade,
            dataRetirada: data.dataRetirada,
            dataDevolucao: data.dataDevolucao,
            valorDiaria: data.valorDiaria,
            valorTotal: data.valorTotal,
            seguro: data.seguro,
            valorSeguro: data.valorSeguro,
            kmLimite: data.kmLimite,
            observacoes: data.observacoes,
          },
          include: RENTAL_INCLUDES.summary,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async applyOpen(
    id: string,
    vehicleId: string,
    data: OpenContractData,
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.rentalContract.update({
        where: { id },
        data: {
          status: 'ATIVO',
          kmRetirada: data.kmRetirada,
          combustivelSaida: data.combustivelSaida,
        },
      }),
      this.prisma.vehicle.update({
        where: { id: vehicleId },
        data: { status: 'ALUGADO' },
      }),
      ...(data.inspection
        ? [
            this.prisma.inspection.create({
              data: {
                contractId: id,
                tipo: 'SAIDA',
                checklist: data.inspection.checklist,
                fotos: data.inspection.fotos,
              },
            }),
          ]
        : []),
    ]);
  }

  async applyClose(
    id: string,
    vehicleId: string,
    data: CloseContractData,
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.rentalContract.update({
        where: { id },
        data: {
          status: 'ENCERRADO',
          dataDevReal: data.dataDevReal,
          kmDevolucao: data.kmDevolucao,
          combustivelChegada: data.combustivelChegada,
          valorTotalReal: data.valorTotalReal,
          observacoes: data.observacoes,
        },
      }),
      this.prisma.vehicle.update({
        where: { id: vehicleId },
        data: { status: 'DISPONIVEL', kmAtual: data.kmDevolucao },
      }),
      ...(data.inspection
        ? [
            this.prisma.inspection.create({
              data: {
                contractId: id,
                tipo: 'CHEGADA',
                checklist: data.inspection.checklist,
                fotos: data.inspection.fotos,
              },
            }),
          ]
        : []),
      ...data.incidents.map((incident) =>
        this.prisma.contractIncident.create({
          data: {
            contractId: id,
            tipo: incident.tipo,
            descricao: incident.descricao,
            valor: incident.valor,
            cobradoCliente: incident.cobradoCliente,
            fotos: [],
            data: incident.data,
          },
        }),
      ),
    ]);
  }

  async applyCancel(id: string, vehicleId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.rentalContract.update({
        where: { id },
        data: { status: 'CANCELADO' },
      }),
      this.prisma.vehicle.update({
        where: { id: vehicleId },
        data: { status: 'DISPONIVEL' },
      }),
    ]);
  }

  findConfirmedContractPayment(contractId: string) {
    return this.prisma.payment.findFirst({
      where: { contractId, status: 'CONFIRMADO' },
    });
  }

  createConfirmedPayment(data: CreateConfirmedPaymentData) {
    return this.prisma.payment.create({
      data: {
        refType: 'RENTAL_CONTRACT',
        contractId: data.contractId,
        customerId: data.customerId,
        valor: data.valor,
        metodo: data.metodo,
        status: 'CONFIRMADO',
      },
    });
  }
}
