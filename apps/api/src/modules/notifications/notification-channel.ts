/**
 * Single notification abstraction. Email and WhatsApp are interchangeable
 * adapters of this port, selectable by recipient preference. Tests use a fake
 * channel implementing the same port.
 */

export const NOTIFICATION_CHANNELS = 'NOTIFICATION_CHANNELS';

export type NotificationChannelKind = 'EMAIL' | 'WHATSAPP';

export interface NotificationRecipient {
  nome?: string;
  email?: string | null;
  phone?: string | null;
}

export interface NotificationMessage {
  recipient: NotificationRecipient;
  subject?: string;
  /** Plain-text body (used as-is by WhatsApp; wrapped in HTML for email). */
  text: string;
  /** Optional rich HTML body for email. */
  html?: string;
}

export abstract class NotificationChannel {
  abstract readonly kind: NotificationChannelKind;

  /** Whether this channel can deliver to the given recipient. */
  abstract canDeliver(recipient: NotificationRecipient): boolean;

  abstract send(message: NotificationMessage): Promise<void>;
}
