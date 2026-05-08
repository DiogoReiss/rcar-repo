import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import { MailService } from './mail.service';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

describe('MailService', () => {
  const sendMail = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail });
  });

  it('sends email with configured from address', async () => {
    sendMail.mockResolvedValue({ messageId: 'm-1' });
    const config = new ConfigService({ SMTP_FROM: 'noreply@rcar.com.br' });
    const service = new MailService(config);

    await service.send({
      to: 'cliente@rcar.com.br',
      subject: 'Teste',
      html: '<p>ok</p>',
    });

    expect(sendMail).toHaveBeenCalledWith({
      from: 'noreply@rcar.com.br',
      to: 'cliente@rcar.com.br',
      subject: 'Teste',
      html: '<p>ok</p>',
    });
  });

  it('swallows transport errors without throwing', async () => {
    sendMail.mockRejectedValue(new Error('SMTP down'));
    const service = new MailService(new ConfigService());

    await expect(
      service.send({
        to: 'cliente@rcar.com.br',
        subject: 'Teste',
        html: '<p>ok</p>',
      }),
    ).resolves.toBeUndefined();
  });
});
