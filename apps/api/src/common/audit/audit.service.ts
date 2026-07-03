import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';

export interface AuditEntry {
  userId?: string | null;
  acao: string;
  entidade: string;
  entidadeId?: string | null;
  detalhes?: Prisma.InputJsonValue;
  ip?: string | null;
}

/**
 * Central auditing helper. Persists critical domain events to `AuditLog`.
 * Failures are logged but never bubble up so auditing never breaks a flow.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: entry.userId ?? null,
          acao: entry.acao,
          entidade: entry.entidade,
          entidadeId: entry.entidadeId ?? null,
          detalhes: entry.detalhes,
          ip: entry.ip ?? null,
        },
      });
    } catch (err) {
      this.logger.warn(
        `Falha ao registrar auditoria (${entry.acao}): ${(err as Error).message}`,
      );
    }
  }
}
