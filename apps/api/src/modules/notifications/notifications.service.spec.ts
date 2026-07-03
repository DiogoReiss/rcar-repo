import { NotificationsService } from './notifications.service';
import {
  NotificationChannel,
  NotificationChannelKind,
  NotificationMessage,
  NotificationRecipient,
} from './notification-channel';

class FakeChannel extends NotificationChannel {
  readonly sent: NotificationMessage[] = [];
  constructor(
    readonly kind: NotificationChannelKind,
    private readonly deliverable: (r: NotificationRecipient) => boolean,
  ) {
    super();
  }
  canDeliver(recipient: NotificationRecipient): boolean {
    return this.deliverable(recipient);
  }
  send(message: NotificationMessage): Promise<void> {
    this.sent.push(message);
    return Promise.resolve();
  }
}

describe('NotificationsService', () => {
  const msg = (r: NotificationRecipient): NotificationMessage => ({
    recipient: r,
    text: 'Olá',
    subject: 'Teste',
  });

  it('routes to the preferred channel when it can deliver', async () => {
    const email = new FakeChannel('EMAIL', (r) => !!r.email);
    const whats = new FakeChannel('WHATSAPP', (r) => !!r.phone);
    const service = new NotificationsService([email, whats]);

    const used = await service.notify(
      'WHATSAPP',
      msg({ email: 'a@b.com', phone: '+5511999999999' }),
    );

    expect(used).toBe('WHATSAPP');
    expect(whats.sent).toHaveLength(1);
    expect(email.sent).toHaveLength(0);
  });

  it('falls back to another channel when the preferred cannot deliver', async () => {
    const email = new FakeChannel('EMAIL', (r) => !!r.email);
    const whats = new FakeChannel('WHATSAPP', (r) => !!r.phone);
    const service = new NotificationsService([email, whats]);

    const used = await service.notify('WHATSAPP', msg({ email: 'a@b.com' }));

    expect(used).toBe('EMAIL');
    expect(email.sent).toHaveLength(1);
  });

  it('returns null when no channel can deliver', async () => {
    const email = new FakeChannel('EMAIL', (r) => !!r.email);
    const whats = new FakeChannel('WHATSAPP', (r) => !!r.phone);
    const service = new NotificationsService([email, whats]);

    const used = await service.notify('EMAIL', msg({}));

    expect(used).toBeNull();
  });
});
