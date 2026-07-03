import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  NotificationChannel,
  NotificationChannelKind,
  NotificationMessage,
  NotificationRecipient,
} from './notification-channel.js';

/**
 * WhatsApp adapter. In dev/test (or without provider credentials) it logs the
 * outbound message instead of calling a real provider, keeping it a drop-in
 * peer of the email channel behind the same port.
 */
@Injectable()
export class WhatsappNotificationChannel extends NotificationChannel {
  readonly kind: NotificationChannelKind = 'WHATSAPP';
  private readonly logger = new Logger(WhatsappNotificationChannel.name);

  constructor(private readonly config: ConfigService) {
    super();
  }

  canDeliver(recipient: NotificationRecipient): boolean {
    return Boolean(recipient.phone);
  }

  send(message: NotificationMessage): Promise<void> {
    const phone = message.recipient.phone;
    if (!phone) return Promise.resolve();
    const token = this.config.get<string>('WHATSAPP_API_TOKEN');
    if (!token) {
      this.logger.log(
        `WhatsApp (simulado) → ${phone}: ${message.text.slice(0, 120)}`,
      );
      return Promise.resolve();
    }
    // Real provider integration would go here (same port contract).
    this.logger.log(`WhatsApp → ${phone}`);
    return Promise.resolve();
  }
}
