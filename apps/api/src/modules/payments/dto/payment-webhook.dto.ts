import { IsIn, IsString, MinLength } from 'class-validator';

export const PAYMENT_WEBHOOK_STATUSES = [
  'CONFIRMED',
  'REFUSED',
  'CANCELLED',
] as const;

export type PaymentWebhookStatus = (typeof PAYMENT_WEBHOOK_STATUSES)[number];

export class PaymentWebhookDto {
  @IsString()
  @MinLength(1)
  eventId!: string;

  /** External transaction id (pagarmeTxId) of the charge. */
  @IsString()
  @MinLength(1)
  externalId!: string;

  @IsIn(PAYMENT_WEBHOOK_STATUSES)
  status!: PaymentWebhookStatus;
}
