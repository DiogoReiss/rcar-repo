import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DomainEventsService } from '../../common/events/domain-events.service.js';
import {
  ATENDIMENTO_CONCLUIDO,
  AtendimentoConcluidoEvent,
} from '../lavajato/lavajato.events.js';
import { InventoryRepository } from './inventory.repository.js';

/**
 * Subscribes the inventory module to the Atendimento `AtendimentoConcluido`
 * domain event and auto-debits stock. Living here (not in LavajatoService)
 * keeps stock behavior — and its failures — inside the module that owns
 * inventory: deduction errors are logged instead of being hidden inside the
 * schedule/queue update.
 */
@Injectable()
export class StockDeductionService implements OnModuleInit {
  private readonly logger = new Logger(StockDeductionService.name);

  constructor(
    private readonly events: DomainEventsService,
    private readonly repo: InventoryRepository,
  ) {}

  onModuleInit(): void {
    this.events.subscribe<AtendimentoConcluidoEvent>(
      ATENDIMENTO_CONCLUIDO,
      (event) => {
        void this.handle(event);
      },
    );
  }

  async handle(event: AtendimentoConcluidoEvent): Promise<void> {
    try {
      await this.repo.deductForAtendimento(
        event.refId,
        event.items.map((item) => ({
          productId: item.productId,
          quantidade: item.quantidade,
        })),
      );
    } catch (err) {
      this.logger.warn(
        `Baixa automática de estoque do atendimento ${event.refId} falhou: ${
          (err as Error).message
        }`,
      );
    }
  }
}
