import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { PrismaService } from '../../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';

@Injectable()
export class ScheduledJobsService {
  private readonly logger = new Logger(ScheduledJobsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('email') private readonly emailQueue: Queue,
    private readonly notifications: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async checkLowStock() {
    this.logger.log('Running low-stock check…');
    const lowStock = await this.prisma.$queryRaw<
      Array<{ nome: string; quantidade_atual: number; estoque_minimo: number }>
    >`
      SELECT nome, quantidade_atual, estoque_minimo
      FROM products WHERE ativo = true AND deleted_at IS NULL
      AND quantidade_atual <= estoque_minimo ORDER BY nome
    `;

    if (lowStock.length > 0) {
      const items = lowStock
        .map(
          (p) =>
            `• ${p.nome}: ${p.quantidade_atual} (mín. ${p.estoque_minimo})`,
        )
        .join('\n');
      await this.emailQueue.add('send', {
        to: process.env.ALERT_EMAIL ?? 'admin@rcar.com.br',
        subject: `⚠️ Alerta: ${lowStock.length} produto(s) com estoque baixo`,
        html: `<p>Os seguintes produtos estão abaixo do estoque mínimo:</p><pre>${items}</pre>`,
      });
      this.logger.warn(`Low-stock alert: ${lowStock.length} products`);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_7AM)
  async sendDailyReminders() {
    this.logger.log("Checking today's schedules for reminders…");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);

    const schedules = await this.prisma.washSchedule.findMany({
      where: { dataHora: { gte: today, lte: end }, status: 'AGENDADO' },
      include: {
        customer: {
          select: {
            email: true,
            telefone: true,
            nome: true,
            canalPreferido: true,
          },
        },
        service: { select: { nome: true } },
      },
    });

    for (const s of schedules) {
      if (!s.customer) continue;
      await this.notifications.notify(s.customer.canalPreferido, {
        recipient: {
          nome: s.customer.nome,
          email: s.customer.email,
          phone: s.customer.telefone,
        },
        subject: `🔔 Lembrete: ${s.service.nome} hoje`,
        text: `Olá ${s.customer.nome}, lembrete do seu agendamento de ${s.service.nome} hoje.`,
        html: `<p>Olá <strong>${s.customer.nome}</strong>, lembrete do seu agendamento de <strong>${s.service.nome}</strong> hoje.</p>`,
      });
    }
    this.logger.log(`Sent ${schedules.length} reminders`);
  }

  /**
   * Flags overdue receivables (inadimplência): closed contracts that still have
   * an outstanding balance (a PENDENTE payment) past a grace window, alerting
   * both the manager and the customer.
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkOverduePayments() {
    this.logger.log('Checking overdue payments (inadimplência)…');
    const graceDays = Number(process.env.PAYMENT_GRACE_DAYS ?? 3);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - graceDays);

    const overdue = await this.prisma.payment.findMany({
      where: {
        status: 'PENDENTE',
        createdAt: { lt: cutoff },
      },
      include: {
        customer: {
          select: {
            nome: true,
            email: true,
            telefone: true,
            canalPreferido: true,
          },
        },
      },
    });

    for (const payment of overdue) {
      if (!payment.customer) continue;
      await this.notifications.notify(payment.customer.canalPreferido, {
        recipient: {
          nome: payment.customer.nome,
          email: payment.customer.email,
          phone: payment.customer.telefone,
        },
        subject: '⚠️ Pagamento em aberto — RCar',
        text: `Olá ${payment.customer.nome}, consta um pagamento de R$ ${Number(
          payment.valor,
        ).toFixed(2)} em aberto. Regularize para evitar bloqueios.`,
        html: `<p>Olá <strong>${payment.customer.nome}</strong>, consta um pagamento de <strong>R$ ${Number(
          payment.valor,
        ).toFixed(2)}</strong> em aberto.</p>`,
      });
    }

    if (overdue.length > 0) {
      await this.emailQueue.add('send', {
        to: process.env.ALERT_EMAIL ?? 'admin@rcar.com.br',
        subject: `⚠️ Inadimplência: ${overdue.length} pagamento(s) em aberto`,
        html: `<p>${overdue.length} pagamento(s) pendente(s) há mais de ${graceDays} dias.</p>`,
      });
      this.logger.warn(`Overdue payments: ${overdue.length}`);
    }
    this.logger.log(`Overdue check complete (${overdue.length})`);
  }
}
