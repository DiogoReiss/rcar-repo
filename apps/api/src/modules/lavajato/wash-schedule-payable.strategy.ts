import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PaymentRefType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { PayableRegistry } from '../payments/payable-registry.js';
import { PayableInfo, PayableStrategy } from '../payments/payable-strategy.js';

/**
 * Resolves a {@link PayableInfo} for a scheduled wash. Lives in the Agendamento
 * module and self-registers into the {@link PayableRegistry}.
 */
@Injectable()
export class WashSchedulePayableStrategy
  implements PayableStrategy, OnModuleInit
{
  readonly refType: PaymentRefType = 'WASH_SCHEDULE';

  constructor(
    private readonly prisma: PrismaService,
    private readonly payables: PayableRegistry,
  ) {}

  onModuleInit(): void {
    this.payables.register(this);
  }

  async resolve(refId: string): Promise<PayableInfo> {
    const schedule = await this.prisma.washSchedule.findUnique({
      where: { id: refId },
      include: {
        service: { select: { preco: true } },
        customer: { select: { id: true, nome: true } },
      },
    });
    if (!schedule) throw new NotFoundException('Agendamento não encontrado');
    return {
      valor: Number(schedule.service.preco),
      customerId: schedule.customerId,
      customerName: schedule.customer?.nome ?? schedule.nomeAvulso ?? null,
      scheduleId: schedule.id,
    };
  }
}
