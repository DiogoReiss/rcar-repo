import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class ScheduledJobsService {
  private readonly logger = new Logger(ScheduledJobsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('email') private readonly emailQueue: Queue,
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
        customer: { select: { email: true, nome: true } },
        service: { select: { nome: true } },
      },
    });

    for (const s of schedules) {
      if (s.customer?.email) {
        await this.emailQueue.add('send', {
          to: s.customer.email,
          subject: `🔔 Lembrete: ${s.service.nome} hoje`,
          html: `<p>Olá <strong>${s.customer.nome}</strong>, lembrete do seu agendamento de <strong>${s.service.nome}</strong> hoje.</p>`,
        });
      }
    }
    this.logger.log(`Sent ${schedules.length} reminders`);
  }
}
