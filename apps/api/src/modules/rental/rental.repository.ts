import { PaymentMethod, Prisma, Vehicle } from '@prisma/client';

/** Data required to create a contract, with derived monetary values precomputed. */
export interface CreateContractData {
  customerId: string;
  vehicleId: string;
  modalidade: Prisma.RentalContractUncheckedCreateInput['modalidade'];
  dataRetirada: Date;
  dataDevolucao: Date;
  valorDiaria: Prisma.Decimal.Value;
  valorTotal: Prisma.Decimal;
  seguro: boolean;
  valorSeguro?: Prisma.Decimal.Value;
  kmLimite?: number;
  observacoes?: string;
}

export interface InspectionData {
  checklist: Prisma.JsonObject;
  fotos: string[];
}

/** State transition applied when a contract is opened (vistoria de saída). */
export interface OpenContractData {
  kmRetirada: number;
  combustivelSaida?: string;
  inspection?: InspectionData;
}

export interface IncidentData {
  tipo: Prisma.ContractIncidentUncheckedCreateInput['tipo'];
  descricao: string;
  valor: Prisma.Decimal;
  cobradoCliente: boolean;
  data: Date;
}

/** State transition applied when a contract is closed (devolução). */
export interface CloseContractData {
  dataDevReal: Date;
  kmDevolucao: number;
  combustivelChegada?: string;
  valorTotalReal: Prisma.Decimal;
  observacoes?: string;
  inspection?: InspectionData;
  incidents: IncidentData[];
}

export interface CreateConfirmedPaymentData {
  contractId: string;
  customerId: string;
  valor: Prisma.Decimal;
  metodo: PaymentMethod;
}

const contractSummaryInclude = {
  customer: { select: { id: true, nome: true } },
  vehicle: { select: { id: true, placa: true, modelo: true } },
} satisfies Prisma.RentalContractInclude;

const contractListInclude = {
  customer: { select: { id: true, nome: true, cpfCnpj: true } },
  vehicle: { select: { id: true, placa: true, modelo: true } },
} satisfies Prisma.RentalContractInclude;

const contractDetailInclude = {
  customer: true,
  vehicle: true,
  inspections: { orderBy: { createdAt: 'asc' } },
  incidents: true,
  payments: true,
} satisfies Prisma.RentalContractInclude;

export type ContractSummary = Prisma.RentalContractGetPayload<{
  include: typeof contractSummaryInclude;
}>;
export type ContractListItem = Prisma.RentalContractGetPayload<{
  include: typeof contractListInclude;
}>;
export type ContractDetail = Prisma.RentalContractGetPayload<{
  include: typeof contractDetailInclude;
}>;

export const RENTAL_INCLUDES = {
  summary: contractSummaryInclude,
  list: contractListInclude,
  detail: contractDetailInclude,
};

/**
 * Seam that centralizes every Prisma access for the Contrato module. The
 * {@link RentalService} orchestrates business rules and talks only to this
 * interface, so the storage adapter can be swapped for an in-memory fake in
 * tests and the service stays free of scattered `prisma.*` calls and includes.
 */
export abstract class RentalRepository {
  abstract findBusyVehicleIds(start: Date, end: Date): Promise<string[]>;
  abstract findAvailableVehicles(excludeIds: string[]): Promise<Vehicle[]>;

  abstract listContracts(
    status: Prisma.RentalContractWhereInput['status'],
    customerId: string | undefined,
    skip: number,
    take: number,
  ): Promise<{ data: ContractListItem[]; total: number }>;

  abstract findContractDetail(id: string): Promise<ContractDetail | null>;
  abstract findContract(
    id: string,
  ): Promise<Prisma.RentalContractGetPayload<object> | null>;

  /**
   * Creates a contract inside a serializable transaction that first rejects any
   * overlapping RESERVADO/ATIVO booking for the same vehicle. Resolves to
   * `null` when a conflicting booking exists.
   */
  abstract createContractExclusive(
    data: CreateContractData,
  ): Promise<ContractSummary | null>;

  abstract applyOpen(
    id: string,
    vehicleId: string,
    data: OpenContractData,
  ): Promise<void>;
  abstract applyClose(
    id: string,
    vehicleId: string,
    data: CloseContractData,
  ): Promise<void>;
  abstract applyCancel(id: string, vehicleId: string): Promise<void>;

  abstract findConfirmedContractPayment(
    contractId: string,
  ): Promise<{ id: string; status: string } | null>;
  abstract createConfirmedPayment(
    data: CreateConfirmedPaymentData,
  ): Promise<Prisma.PaymentGetPayload<object>>;
}
