import { IsIn, IsString, MinLength } from 'class-validator';

export const SIGNATURE_WEBHOOK_STATUSES = [
  'SIGNED',
  'CANCELLED',
  'EXPIRED',
] as const;

export type SignatureWebhookStatus =
  (typeof SIGNATURE_WEBHOOK_STATUSES)[number];

export class SignatureWebhookDto {
  @IsString()
  @MinLength(1)
  eventId!: string;

  @IsString()
  @MinLength(1)
  externalId!: string;

  @IsIn(SIGNATURE_WEBHOOK_STATUSES)
  status!: SignatureWebhookStatus;
}
