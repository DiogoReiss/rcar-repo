import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  NOTIFICATION_CHANNELS,
  NotificationChannel,
  NotificationChannelKind,
  NotificationMessage,
} from './notification-channel.js';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly channels: Map<NotificationChannelKind, NotificationChannel>;

  constructor(@Inject(NOTIFICATION_CHANNELS) channels: NotificationChannel[]) {
    this.channels = new Map(channels.map((c) => [c.kind, c]));
  }

  /**
   * Sends a notification through the preferred channel, falling back to any
   * other channel that can deliver to the recipient.
   */
  async notify(
    preference: NotificationChannelKind | undefined,
    message: NotificationMessage,
  ): Promise<NotificationChannelKind | null> {
    const ordered = this.resolveOrder(preference);
    for (const kind of ordered) {
      const channel = this.channels.get(kind);
      if (channel?.canDeliver(message.recipient)) {
        await channel.send(message);
        return kind;
      }
    }
    this.logger.warn(
      'Nenhum canal de notificação disponível para o destinatário',
    );
    return null;
  }

  private resolveOrder(
    preference?: NotificationChannelKind,
  ): NotificationChannelKind[] {
    const all: NotificationChannelKind[] = ['EMAIL', 'WHATSAPP'];
    if (!preference) return all;
    return [preference, ...all.filter((k) => k !== preference)];
  }
}
