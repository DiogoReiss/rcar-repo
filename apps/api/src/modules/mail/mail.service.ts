import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter;

  constructor(private readonly config: ConfigService) {
    const user = this.config.get('SMTP_USER');
    const pass = this.config.get('SMTP_PASS');
    const host = this.config.get('SMTP_HOST', 'smtp.ethereal.email');
    const port = this.config.get<number>('SMTP_PORT', 587);

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user ? { user, pass } : undefined,
    });
  }

  async send(options: SendMailOptions): Promise<void> {
    const from = this.config.get('SMTP_FROM', 'noreply@rcar.com.br');
    try {
      const info = await this.transporter.sendMail({ from, ...options });
      this.logger.log(`Email sent to ${options.to} — id: ${info.messageId}`);
    } catch (err: any) {
      this.logger.warn(`Email not sent to ${options.to}: ${err.message}`);
    }
  }

  async sendScheduleConfirmation(to: string, clienteNome: string, servicoNome: string, dataHora: string) {
    await this.send({
      to,
      subject: `✅ Agendamento confirmado — ${servicoNome}`,
      html: `<p>Olá <strong>${clienteNome}</strong>,</p>
             <p>Seu agendamento de <strong>${servicoNome}</strong> foi confirmado para <strong>${dataHora}</strong>.</p>
             <p>RCar Lavajato</p>`,
    });
  }

  async sendPasswordReset(to: string, resetUrl: string) {
    await this.send({
      to,
      subject: '🔑 Redefinição de senha — RCar',
      html: `<p>Clique no link abaixo para redefinir sua senha (válido por 1h):</p>
             <p><a href="${resetUrl}">${resetUrl}</a></p>`,
    });
  }

  async sendContractReady(to: string, clienteNome: string, contratoId: string) {
    await this.send({
      to,
      subject: '📄 Contrato de aluguel pronto — RCar',
      html: `<p>Olá <strong>${clienteNome}</strong>,</p>
             <p>Seu contrato de aluguel (Nº ${contratoId}) está pronto para assinatura.</p>
             <p>RCar Renting</p>`,
    });
  }
}

