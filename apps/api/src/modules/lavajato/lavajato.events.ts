/**
 * Domain events emitted by the Atendimento (lavajato) module. Consumers
 * subscribe via the neutral {@link DomainEventsService}; they never call
 * LavajatoService back.
 */

/** Emitted after a wash schedule/queue atendimento is marked CONCLUIDO. */
export const ATENDIMENTO_CONCLUIDO = 'atendimento.concluido';

export interface AtendimentoConcluidoItem {
  productId: string;
  /** Quantity consumed per use, serialized to keep the payload Prisma-free. */
  quantidade: string;
}

export interface AtendimentoConcluidoEvent {
  refId: string;
  items: AtendimentoConcluidoItem[];
}
