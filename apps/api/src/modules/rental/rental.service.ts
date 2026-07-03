import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Prisma, ContractStatus, PaymentMethod } from '@prisma/client';
import { CreateContractDto } from './dto/create-contract.dto.js';
import {
  OpenContractDto,
  CloseContractDto,
} from './dto/contract-operations.dto.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { DomainEventsService } from '../../common/events/domain-events.service.js';
import { RentalRepository } from './rental.repository.js';
import { CONTRATO_FECHADO, ContratoFechadoEvent } from './rental.events.js';

@Injectable()
export class RentalService {
  constructor(
    private readonly repo: RentalRepository,
    private readonly events: DomainEventsService,
  ) {}

  // ─── Availability ─────────────────────────────────────────────────────────

  async checkAvailability(dataRetirada: string, dataDevolucao: string) {
    const start = new Date(dataRetirada);
    const end = new Date(dataDevolucao);

    const busyIds = await this.repo.findBusyVehicleIds(start, end);
    return this.repo.findAvailableVehicles(busyIds);
  }

  // ─── Contracts ────────────────────────────────────────────────────────────

  async findAll(
    status?: ContractStatus,
    customerId?: string,
    pagination?: PaginationDto,
  ) {
    const { page = 1, perPage = 20 } = pagination ?? {};
    const safePage = Math.max(1, page);
    const { data, total } = await this.repo.listContracts(
      status,
      customerId,
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

  async findOne(id: string) {
    const c = await this.repo.findContractDetail(id);
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

    const diffMs = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const valorTotal = new Prisma.Decimal(dto.valorDiaria)
      .mul(diffDays)
      .add(
        dto.seguro && dto.valorSeguro ? new Prisma.Decimal(dto.valorSeguro) : 0,
      );

    // D3: Serializable booking prevents double-booking under concurrency.
    const contract = await this.repo.createContractExclusive({
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
    });
    if (!contract)
      throw new ConflictException(
        'Veículo indisponível para o período selecionado',
      );
    return contract;
  }

  // ─── Open contract (vistoria de saída) ───────────────────────────────────

  async openContract(id: string, dto: OpenContractDto) {
    const contract = await this.repo.findContract(id);
    if (!contract) throw new NotFoundException('Contrato não encontrado');
    // D8: Idempotent — already open.
    if (contract.status === 'ATIVO') return this.findOne(id);
    if (contract.status !== 'RESERVADO')
      throw new BadRequestException('Contrato não está em status RESERVADO');

    if (contract.assinaturaObrigatoria && contract.d4signStatus !== 'SIGNED') {
      throw new BadRequestException(
        'Contrato exige assinatura concluída antes da ativação.',
      );
    }

    await this.repo.applyOpen(id, contract.vehicleId, {
      kmRetirada: dto.kmRetirada,
      combustivelSaida: dto.combustivelSaida,
      inspection:
        dto.checklist || dto.fotos?.length
          ? {
              checklist: (dto.checklist ?? {}) as Prisma.JsonObject,
              fotos: dto.fotos ?? [],
            }
          : undefined,
    });

    return this.findOne(id);
  }

  // ─── Close contract (vistoria de chegada + devolução) ────────────────────

  async closeContract(id: string, dto: CloseContractDto) {
    const contract = await this.repo.findContract(id);
    if (!contract) throw new NotFoundException('Contrato não encontrado');
    // D7: Guard against double-close (must come before status check).
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
    const totalIncidentesCobrados = incidents
      .filter((i) => i.cobradoCliente !== false)
      .reduce((a, i) => a + Number(i.valor ?? 0), 0);
    const valorRealFinal = valorReal.add(
      new Prisma.Decimal(totalIncidentesCobrados),
    );

    await this.repo.applyClose(id, contract.vehicleId, {
      dataDevReal: now,
      kmDevolucao: dto.kmDevolucao,
      combustivelChegada: dto.combustivelChegada,
      valorTotalReal: valorRealFinal,
      observacoes: dto.observacoes,
      inspection:
        dto.checklist || dto.fotos?.length
          ? {
              checklist: (dto.checklist ?? {}) as Prisma.JsonObject,
              fotos: dto.fotos ?? [],
            }
          : undefined,
      incidents: incidents.map((incident) => ({
        tipo: incident.tipo as Prisma.ContractIncidentUncheckedCreateInput['tipo'],
        descricao: incident.descricao,
        valor: new Prisma.Decimal(incident.valor ?? 0),
        cobradoCliente: incident.cobradoCliente ?? true,
        data: now,
      })),
    });

    // The return is settled and committed. Auto-charging the outstanding
    // balance is the Pagamento module's concern: emit a domain event so payment
    // side effects (and any failures) live there, not swallowed here.
    this.events.publish<ContratoFechadoEvent>(CONTRATO_FECHADO, {
      contractId: id,
    });

    return this.findOne(id);
  }

  async cancelContract(id: string) {
    const contract = await this.repo.findContract(id);
    if (!contract) throw new NotFoundException('Contrato não encontrado');
    if (contract.status === 'ATIVO')
      throw new BadRequestException(
        'Contratos ativos não podem ser cancelados direto; use devolução',
      );

    await this.repo.applyCancel(id, contract.vehicleId);
    return this.findOne(id);
  }

  async registerPayment(contractId: string, metodo: PaymentMethod) {
    const contract = await this.repo.findContract(contractId);
    if (!contract) throw new NotFoundException('Contrato não encontrado');

    // D6: Idempotency — return existing confirmed payment on retry.
    const existing = await this.repo.findConfirmedContractPayment(contractId);
    if (existing) return existing;

    return this.repo.createConfirmedPayment({
      contractId,
      customerId: contract.customerId,
      valor: contract.valorTotalReal ?? contract.valorTotal,
      metodo,
    });
  }
}
