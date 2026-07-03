import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PaymentRefType } from '@prisma/client';
import { PayableInfo, PayableStrategy } from './payable-strategy.js';

/**
 * Registry of {@link PayableStrategy} instances keyed by {@link PaymentRefType}.
 * Domain modules register their own strategy at bootstrap; the PaymentsService
 * resolves a payable by delegating to the matching strategy, replacing the old
 * `if (refType === …)` chain with a single dispatch point.
 */
@Injectable()
export class PayableRegistry {
  private readonly logger = new Logger(PayableRegistry.name);
  private readonly strategies = new Map<PaymentRefType, PayableStrategy>();

  register(strategy: PayableStrategy): void {
    this.strategies.set(strategy.refType, strategy);
    this.logger.log(`Payable strategy registered: ${strategy.refType}`);
  }

  resolve(refType: PaymentRefType, refId: string): Promise<PayableInfo> {
    const strategy = this.strategies.get(refType);
    if (!strategy) {
      throw new BadRequestException(
        `Nenhuma estratégia de cobrança registrada para ${refType}.`,
      );
    }
    return strategy.resolve(refId);
  }
}
