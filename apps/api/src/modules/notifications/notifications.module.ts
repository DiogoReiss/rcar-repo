import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NOTIFICATION_CHANNELS } from './notification-channel.js';
import { EmailNotificationChannel } from './email-notification.channel.js';
import { WhatsappNotificationChannel } from './whatsapp-notification.channel.js';
import { NotificationsService } from './notifications.service.js';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    EmailNotificationChannel,
    WhatsappNotificationChannel,
    {
      provide: NOTIFICATION_CHANNELS,
      useFactory: (
        email: EmailNotificationChannel,
        whatsapp: WhatsappNotificationChannel,
      ) => [email, whatsapp],
      inject: [EmailNotificationChannel, WhatsappNotificationChannel],
    },
    NotificationsService,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
