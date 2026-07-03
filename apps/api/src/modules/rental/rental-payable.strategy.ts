import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PaymentRefType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { PayableRegistry } from '../payments/payable-registry.js';
import { PayableInfo, PayableStrategy } from '../payments/payable-strategy.js';

/**
 * Resolves a {@link PayableInfo} for a rental contract. Lives in the Contrato
 * module and registers itself into the {@link PayableRegistry} at bootstrap, so
 * the Pagamento module never references RentalContract directly.
 */
@Injectable()
export class RentalPayableStrategy implements PayableStrategy, OnModuleInit {
  readonly refType: PaymentRefType = 'RENTAL_CONTRACT';

  constructor(
    private readonly prisma: PrismaService,
    private readonly payables: PayableRegistry,
  ) {}

  onModuleInit(): void {
    this.payables.register(this);
  }

  async resolve(refId: string): Promise<PayableInfo> {
    const contract = await this.prisma.rentalContract.findUnique({
      where: { id: refId },
      include: { customer: { select: { id: true, nome: true } } },
    });
    if (!contract) throw new NotFoundException('Contrato não encontrado');
    return {
      valor: Number(contract.valorTotalReal ?? contract.valorTotal),
      customerId: contract.customerId,
      customerName: contract.customer?.nome ?? null,
      contractId: contract.id,
    };
  }
}
