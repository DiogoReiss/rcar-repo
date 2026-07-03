import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DomainEventsService } from '../../common/events/domain-events.service.js';
import {
  CONTRATO_FECHADO,
  ContratoFechadoEvent,
} from '../rental/rental.events.js';
import { PaymentsService } from './payments.service.js';

/**
 * Subscribes the Pagamento module to the Contrato `ContratoFechado` domain
 * event and auto-charges any outstanding balance. Living here (not in
 * RentalService) keeps payment behavior — and its failures — inside the module
 * that owns payments: errors are logged as warnings instead of being swallowed
 * inside the contract-return transaction.
 */
@Injectable()
export class ContractClosedListener implements OnModuleInit {
  private readonly logger = new Logger(ContractClosedListener.name);

  constructor(
    private readonly events: DomainEventsService,
    private readonly payments: PaymentsService,
  ) {}

  onModuleInit(): void {
    this.events.subscribe<ContratoFechadoEvent>(CONTRATO_FECHADO, (payload) => {
      void this.autoCharge(payload.contractId);
    });
  }

  async autoCharge(contractId: string): Promise<void> {
    try {
      const balance = await this.payments.getBalance(
        'RENTAL_CONTRACT',
        contractId,
      );
      if (balance.saldo > 0) {
        await this.payments.startCharge({
          refType: 'RENTAL_CONTRACT',
          refId: contractId,
          metodo: 'PIX',
        });
      }
    } catch (err) {
      this.logger.warn(
        `Auto-cobrança do contrato ${contractId} falhou: ${(err as Error).message}`,
      );
    }
  }
}
