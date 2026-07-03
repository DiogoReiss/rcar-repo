/**
 * Single outbound port for the payment gateway. External providers (e.g.
 * Pagar.me) are adapters of this port; tests/dev use {@link FakePaymentGateway}.
 */

export const PAYMENT_GATEWAY = 'PAYMENT_GATEWAY';

export type GatewayChargeMethod = 'PIX' | 'CARTAO_CREDITO' | 'BOLETO';

export type GatewayChargeStatus = 'PENDING' | 'CONFIRMED' | 'REFUSED';

export interface CreateChargeRequest {
  /** Amount in BRL (major units). */
  amount: number;
  method: GatewayChargeMethod;
  description?: string;
  customerName?: string;
  /** Boleto due date (ISO). */
  dueDate?: string;
  /** Card token/details for CARTAO_CREDITO charges. */
  cardToken?: string;
}

export interface ChargeResult {
  externalId: string;
  status: GatewayChargeStatus;
  /** Pix copy-and-paste code, when method = PIX. */
  pixQrCode?: string;
  /** Boleto URL, when method = BOLETO. */
  boletoUrl?: string;
}

export interface ChargeStatusResult {
  externalId: string;
  status: GatewayChargeStatus;
}

export abstract class PaymentGateway {
  abstract createCharge(request: CreateChargeRequest): Promise<ChargeResult>;

  abstract getStatus(externalId: string): Promise<ChargeStatusResult>;

  abstract refund(externalId: string): Promise<void>;
}
