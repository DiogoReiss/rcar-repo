import type {
  PaymentDTO,
  PaymentMethod,
  PaymentRefType,
  PaymentStatus,
} from '@rcar/shared-types';

/**
 * Frontend domain model for a payment.
 *
 * This is the store/view shape and is owned by the frontend — it is intentionally
 * distinct from the {@link PaymentDTO} wire contract. Here `createdAt` is a real
 * `Date` (ready for formatting/sorting) rather than the ISO string sent over the
 * wire, so the UI can evolve its model without depending on transport details.
 */
export interface Payment {
  id: string;
  refType: PaymentRefType;
  scheduleId?: string;
  queueId?: string;
  contractId?: string;
  customerId?: string;
  valor: number;
  metodo: PaymentMethod;
  status: PaymentStatus;
  observacoes?: string;
  createdAt: Date;
}

/**
 * Frontend seam (fromDTO): maps the {@link PaymentDTO} received over the wire
 * (HTTP or the in-memory mock) into the frontend {@link Payment} domain model.
 * A contract change is absorbed here instead of rippling through components.
 */
export function fromPaymentDTO(dto: PaymentDTO): Payment {
  return {
    id: dto.id,
    refType: dto.refType,
    scheduleId: dto.scheduleId,
    queueId: dto.queueId,
    contractId: dto.contractId,
    customerId: dto.customerId,
    valor: Number(dto.valor),
    metodo: dto.metodo,
    status: dto.status,
    observacoes: dto.observacoes,
    createdAt: new Date(dto.createdAt),
  };
}
