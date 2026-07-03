import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  ChargeResult,
  ChargeStatusResult,
  CreateChargeRequest,
  GatewayChargeStatus,
  PaymentGateway,
} from './payment-gateway.js';

interface FakeCharge {
  externalId: string;
  amount: number;
  status: GatewayChargeStatus;
}

/**
 * In-memory payment gateway used for dev/testing. Simulates the outbound
 * behaviour of a real gateway (e.g. Pagar.me) without any network calls.
 *
 * A non-positive amount, or a description/customer name matching "recusa"/
 * "fail", makes the charge be refused so callers can exercise the refusal path.
 */
@Injectable()
export class FakePaymentGateway extends PaymentGateway {
  private readonly charges = new Map<string, FakeCharge>();

  createCharge(request: CreateChargeRequest): Promise<ChargeResult> {
    const marker = `${request.description ?? ''} ${request.customerName ?? ''}`;
    if (request.amount <= 0 || /recusa|fail/i.test(marker)) {
      throw new BadRequestException(
        'Cobrança recusada pelo gateway de pagamento.',
      );
    }
    const externalId = `fake-${request.method.toLowerCase()}-${randomUUID()}`;
    this.charges.set(externalId, {
      externalId,
      amount: request.amount,
      status: 'PENDING',
    });
    return Promise.resolve({
      externalId,
      status: 'PENDING',
      pixQrCode:
        request.method === 'PIX'
          ? `000201${externalId.replace(/-/g, '').slice(0, 20)}`
          : undefined,
      boletoUrl:
        request.method === 'BOLETO'
          ? `https://fake-gateway.local/boleto/${externalId}.pdf`
          : undefined,
    });
  }

  getStatus(externalId: string): Promise<ChargeStatusResult> {
    const charge = this.charges.get(externalId);
    return Promise.resolve({
      externalId,
      status: charge?.status ?? 'PENDING',
    });
  }

  refund(externalId: string): Promise<void> {
    const charge = this.charges.get(externalId);
    if (charge) charge.status = 'REFUSED';
    return Promise.resolve();
  }

  /** Test helper: force a status transition as if the gateway notified us. */
  __setStatus(externalId: string, status: GatewayChargeStatus): void {
    const charge = this.charges.get(externalId);
    if (charge) charge.status = status;
  }
}
