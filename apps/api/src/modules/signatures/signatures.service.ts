import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service.js';
import { DocumentsService } from '../documents/documents.service.js';
import { StorageService } from '../storage/storage.service.js';
import { AuditService } from '../../common/audit/audit.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { SIGNATURE_PROVIDER, SignatureProvider } from './signature-provider.js';
import { SignatureWebhookDto } from './dto/signature-webhook.dto.js';
import { verifyWebhookSignature } from './webhook-signature.util.js';

interface ActingUser {
  id?: string;
  role?: string;
}

const WEBHOOK_SOURCE = 'SIGNATURE';

@Injectable()
export class SignaturesService {
  private readonly logger = new Logger(SignaturesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly documents: DocumentsService,
    private readonly storage: StorageService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
    private readonly config: ConfigService,
    @Inject(SIGNATURE_PROVIDER)
    private readonly provider: SignatureProvider,
  ) {}

  /** Current signature status of a contract (read model). */
  async getStatus(contractId: string) {
    const contract = await this.prisma.rentalContract.findUnique({
      where: { id: contractId },
      select: {
        id: true,
        d4signId: true,
        d4signStatus: true,
        signedDocumentKey: true,
      },
    });
    if (!contract) throw new NotFoundException('Contrato não encontrado');
    return {
      contractId: contract.id,
      externalId: contract.d4signId,
      status: contract.d4signStatus ?? null,
      hasSignedDocument: Boolean(contract.signedDocumentKey),
    };
  }

  /**
   * Generates the contract PDF (reusing the documents template→PDF flow) and
   * sends it for signature through the {@link SignatureProvider} port,
   * persisting the external id and status on the contract. Emails the customer
   * an invite/link to sign.
   */
  async sendForSignature(contractId: string, user?: ActingUser) {
    const contract = await this.prisma.rentalContract.findUnique({
      where: { id: contractId },
      include: {
        customer: { select: { nome: true, email: true, telefone: true } },
        vehicle: { select: { placa: true, modelo: true } },
      },
    });
    if (!contract) throw new NotFoundException('Contrato não encontrado');
    if (contract.d4signStatus === 'SIGNED') {
      throw new BadRequestException('Contrato já foi assinado.');
    }

    const template = await this.prisma.template.findFirst({
      where: { tipo: 'CONTRATO_LOCACAO', ativo: true },
      select: { id: true },
    });
    if (!template) {
      throw new BadRequestException(
        'Nenhum template de contrato (CONTRATO_LOCACAO) ativo encontrado.',
      );
    }

    const documentName = `contrato-${contract.id.slice(0, 8)}.pdf`;
    const { buffer } = await this.documents.generateTemplatePdf(
      template.id,
      {
        contratoId: contract.id,
        nomeCliente: contract.customer?.nome ?? 'Cliente',
        placaVeiculo: contract.vehicle?.placa ?? '—',
        modeloVeiculo: contract.vehicle?.modelo ?? '—',
        valorTotal: Number(contract.valorTotal),
      },
      documentName,
    );

    const result = await this.provider.createSignatureRequest({
      contractId: contract.id,
      documentName,
      content: buffer,
      signerName: contract.customer?.nome ?? undefined,
      signerEmail: contract.customer?.email ?? undefined,
    });

    const updated = await this.prisma.rentalContract.update({
      where: { id: contract.id },
      data: { d4signId: result.externalId, d4signStatus: result.status },
      select: { id: true, d4signId: true, d4signStatus: true },
    });

    await this.sendInviteEmail(contract.id, contract.customer);

    await this.audit.record({
      userId: user?.id ?? null,
      acao: 'SIGNATURE_SENT',
      entidade: 'RentalContract',
      entidadeId: contract.id,
      detalhes: { externalId: result.externalId, status: result.status },
    });

    return {
      contractId: updated.id,
      externalId: updated.d4signId,
      status: updated.d4signStatus,
    };
  }

  /** Re-sends a pending signature request (invite). */
  async resend(contractId: string, user?: ActingUser) {
    const contract = await this.prisma.rentalContract.findUnique({
      where: { id: contractId },
      select: { id: true, d4signStatus: true },
    });
    if (!contract) throw new NotFoundException('Contrato não encontrado');
    if (contract.d4signStatus === 'SIGNED') {
      throw new BadRequestException('Contrato já foi assinado.');
    }
    return this.sendForSignature(contractId, user);
  }

  /** Cancels a pending signature request. */
  async cancel(contractId: string, user?: ActingUser) {
    const contract = await this.prisma.rentalContract.findUnique({
      where: { id: contractId },
      select: { id: true, d4signId: true, d4signStatus: true },
    });
    if (!contract) throw new NotFoundException('Contrato não encontrado');
    if (contract.d4signStatus === 'SIGNED') {
      throw new BadRequestException(
        'Contrato já assinado não pode ser cancelado.',
      );
    }
    if (contract.d4signId) {
      await this.provider.cancel(contract.d4signId);
    }
    await this.prisma.rentalContract.update({
      where: { id: contract.id },
      data: { d4signStatus: 'CANCELLED' },
    });
    await this.audit.record({
      userId: user?.id ?? null,
      acao: 'SIGNATURE_CANCELLED',
      entidade: 'RentalContract',
      entidadeId: contract.id,
    });
    return { contractId: contract.id, status: 'CANCELLED' };
  }

  /**
   * Processes an inbound provider webhook. Authenticated via HMAC signature and
   * idempotent: a repeated (source, eventId) is a no-op. On SIGNED, fetches the
   * signed document, stores it privately, and emails the customer a confirmation.
   */
  async handleWebhook(dto: SignatureWebhookDto, signatureHeader?: string) {
    const secret = this.config.get<string>(
      'SIGNATURE_WEBHOOK_SECRET',
      'dev-signature-secret',
    );
    const authentic = verifyWebhookSignature(
      secret,
      { eventId: dto.eventId, externalId: dto.externalId, status: dto.status },
      signatureHeader,
    );
    if (!authentic) {
      throw new ForbiddenException('Assinatura do webhook inválida.');
    }

    // Idempotency: record the event; a duplicate hits the unique constraint.
    try {
      await this.prisma.webhookEvent.create({
        data: {
          source: WEBHOOK_SOURCE,
          eventId: dto.eventId,
          status: dto.status,
          detalhes: { externalId: dto.externalId },
        },
      });
    } catch {
      this.logger.log(
        `Webhook de assinatura duplicado ignorado (eventId=${dto.eventId})`,
      );
      return { received: true, duplicate: true };
    }

    const contract = await this.prisma.rentalContract.findFirst({
      where: { d4signId: dto.externalId },
      include: {
        customer: { select: { nome: true, email: true, telefone: true } },
      },
    });
    if (!contract) {
      this.logger.warn(
        `Webhook de assinatura sem contrato correspondente (externalId=${dto.externalId})`,
      );
      return { received: true, matched: false };
    }

    let signedDocumentKey = contract.signedDocumentKey ?? undefined;
    if (dto.status === 'SIGNED') {
      try {
        const signed = await this.provider.getSignedDocument(dto.externalId);
        signedDocumentKey = await this.storage.putObject(
          signed,
          `contrato-assinado-${contract.id.slice(0, 8)}.pdf`,
          'application/pdf',
        );
      } catch (err) {
        this.logger.warn(
          `Falha ao armazenar documento assinado: ${(err as Error).message}`,
        );
      }
    }

    await this.prisma.rentalContract.update({
      where: { id: contract.id },
      data: { d4signStatus: dto.status, signedDocumentKey },
    });

    await this.audit.record({
      acao: `SIGNATURE_WEBHOOK_${dto.status}`,
      entidade: 'RentalContract',
      entidadeId: contract.id,
      detalhes: { eventId: dto.eventId, externalId: dto.externalId },
    });

    if (dto.status === 'SIGNED') {
      await this.sendConfirmationEmail(contract.id, contract.customer);
    }

    return { received: true, contractId: contract.id, status: dto.status };
  }

  /** Signed, time-limited download URL for the signed contract document. */
  async getSignedDocumentUrl(contractId: string) {
    const contract = await this.prisma.rentalContract.findUnique({
      where: { id: contractId },
      select: { id: true, signedDocumentKey: true },
    });
    if (!contract) throw new NotFoundException('Contrato não encontrado');
    if (!contract.signedDocumentKey) {
      throw new NotFoundException(
        'Documento assinado ainda não disponível para este contrato.',
      );
    }
    const { signedUrl, expiresAt } = await this.storage.getSignedUrlForKey(
      contract.signedDocumentKey,
      `contrato-${contract.id.slice(0, 8)}.pdf`,
    );
    return { contractId: contract.id, url: signedUrl, expiresAt };
  }

  private async sendInviteEmail(
    contractId: string,
    customer?: { nome: string; email: string | null; telefone: string | null },
  ) {
    if (!customer?.email && !customer?.telefone) return;
    const link = `${this.portalBaseUrl()}/portal-cliente/documentos?contrato=${contractId}`;
    await this.notifications.notify('EMAIL', {
      recipient: {
        nome: customer.nome,
        email: customer.email,
        phone: customer.telefone,
      },
      subject: '✍️ Assinatura do seu contrato de locação — RCar',
      text: `Olá ${customer.nome}, seu contrato está pronto para assinatura: ${link}`,
      html: `<p>Olá <strong>${customer.nome}</strong>,</p>
             <p>Seu contrato de locação está pronto para assinatura.</p>
             <p><a href="${link}">Clique aqui para assinar</a>.</p>`,
    });
  }

  private async sendConfirmationEmail(
    contractId: string,
    customer?: { nome: string; email: string | null; telefone: string | null },
  ) {
    if (!customer?.email && !customer?.telefone) return;
    const link = `${this.portalBaseUrl()}/portal-cliente/documentos?contrato=${contractId}`;
    await this.notifications.notify('EMAIL', {
      recipient: {
        nome: customer.nome,
        email: customer.email,
        phone: customer.telefone,
      },
      subject: '✅ Contrato assinado — RCar',
      text: `Olá ${customer.nome}, seu contrato foi assinado com sucesso. Documento: ${link}`,
      html: `<p>Olá <strong>${customer.nome}</strong>,</p>
             <p>Seu contrato foi assinado com sucesso.</p>
             <p><a href="${link}">Acesse o documento assinado</a>.</p>`,
    });
  }

  private portalBaseUrl(): string {
    return this.config.get<string>('PORTAL_BASE_URL', 'http://localhost:4200');
  }
}
