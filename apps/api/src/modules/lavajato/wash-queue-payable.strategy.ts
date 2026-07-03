import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PaymentRefType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { PayableRegistry } from '../payments/payable-registry.js';
import { PayableInfo, PayableStrategy } from '../payments/payable-strategy.js';

/**
 * Resolves a {@link PayableInfo} for a walk-in wash queue item. Lives in the
 * Fila module and self-registers into the {@link PayableRegistry}.
 */
@Injectable()
export class WashQueuePayableStrategy implements PayableStrategy, OnModuleInit {
  readonly refType: PaymentRefType = 'WASH_QUEUE';

  constructor(
    private readonly prisma: PrismaService,
    private readonly payables: PayableRegistry,
  ) {}

  onModuleInit(): void {
    this.payables.register(this);
  }

  async resolve(refId: string): Promise<PayableInfo> {
    const queue = await this.prisma.washQueue.findUnique({
      where: { id: refId },
      include: {
        service: { select: { preco: true } },
        customer: { select: { id: true, nome: true } },
      },
    });
    if (!queue) throw new NotFoundException('Item de fila não encontrado');
    return {
      valor: Number(queue.service.preco),
      customerId: queue.customerId,
      customerName: queue.customer?.nome ?? queue.nomeAvulso ?? null,
      queueId: queue.id,
    };
  }
}
