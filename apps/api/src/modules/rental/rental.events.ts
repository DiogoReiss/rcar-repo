/**
 * Domain events emitted by the Contrato (rental) module. Consumers subscribe via
 * the neutral {@link DomainEventsService}; they never call RentalService back.
 */

/** Emitted after a contract is settled and its return transaction commits. */
export const CONTRATO_FECHADO = 'contrato.fechado';

export interface ContratoFechadoEvent {
  contractId: string;
}
