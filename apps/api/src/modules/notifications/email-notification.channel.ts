import { Injectable } from '@nestjs/common';
import { MailService } from '../mail/mail.service.js';
import {
  NotificationChannel,
  NotificationChannelKind,
  NotificationMessage,
  NotificationRecipient,
} from './notification-channel.js';

@Injectable()
export class EmailNotificationChannel extends NotificationChannel {
  readonly kind: NotificationChannelKind = 'EMAIL';

  constructor(private readonly mail: MailService) {
    super();
  }

  canDeliver(recipient: NotificationRecipient): boolean {
    return Boolean(recipient.email);
  }

  async send(message: NotificationMessage): Promise<void> {
    if (!message.recipient.email) return;
    await this.mail.send({
      to: message.recipient.email,
      subject: message.subject ?? 'RCar',
      html: message.html ?? `<p>${message.text}</p>`,
    });
  }
}
