import { Prisma, WashService as WashServiceModel } from '@prisma/client';

/** Fields accepted when creating a wash service. */
export interface CreateWashServiceData {
  nome: string;
  descricao?: string;
  preco: Prisma.Decimal.Value;
  duracaoMin: number;
}

/** Partial update payload, including the active flag toggle. */
export interface UpdateWashServiceData {
  nome?: string;
  descricao?: string;
  preco?: Prisma.Decimal.Value;
  duracaoMin?: number;
  ativo?: boolean;
}

const washServiceDetailInclude = {
  products: { include: { product: true } },
} satisfies Prisma.WashServiceInclude;

export type WashServiceDetail = Prisma.WashServiceGetPayload<{
  include: typeof washServiceDetailInclude;
}>;

export const WASH_INCLUDES = {
  detail: washServiceDetailInclude,
};

/**
 * Seam that centralizes every Prisma access for the wash-service catalog. The
 * {@link WashService} keeps the pagination and soft-delete business rules and
 * talks only to this interface, so the storage adapter can be swapped for an
 * in-memory fake in tests and the service stays free of scattered `prisma.*`
 * calls and `.include()` chains.
 */
export abstract class WashRepository {
  abstract listServices(
    includeInactive: boolean,
    skip: number,
    take: number,
  ): Promise<{ data: WashServiceModel[]; total: number }>;

  abstract listAllServices(
    includeInactive: boolean,
  ): Promise<WashServiceModel[]>;

  abstract findServiceDetail(id: string): Promise<WashServiceDetail | null>;

  abstract createService(
    data: CreateWashServiceData,
  ): Promise<WashServiceModel>;

  abstract updateService(
    id: string,
    data: UpdateWashServiceData,
  ): Promise<WashServiceModel>;

  abstract deactivateService(id: string): Promise<WashServiceModel>;
}
