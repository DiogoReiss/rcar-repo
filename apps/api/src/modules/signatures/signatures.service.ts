import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { DocumentsService } from '../documents/documents.service.js';
import { AuditService } from '../../common/audit/audit.service.js';
import { SIGNATURE_PROVIDER, SignatureProvider } from './signature-provider.js';

interface ActingUser {
  id?: string;
  role?: string;
}

@Injectable()
export class SignaturesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly documents: DocumentsService,
    private readonly audit: AuditService,
    @Inject(SIGNATURE_PROVIDER)
    private readonly provider: SignatureProvider,
  ) {}

  /** Current signature status of a contract (read model). */
  async getStatus(contractId: string) {
    const contract = await this.prisma.rentalContract.findUnique({
      where: { id: contractId },
      select: { id: true, d4signId: true, d4signStatus: true },
    });
    if (!contract) throw new NotFoundException('Contrato não encontrado');
    return {
      contractId: contract.id,
      externalId: contract.d4signId,
      status: contract.d4signStatus ?? null,
    };
  }

  /**
   * Generates the contract PDF (reusing the documents template→PDF flow) and
   * sends it for signature through the {@link SignatureProvider} port,
   * persisting the external id and status on the contract.
   */
  async sendForSignature(contractId: string, user?: ActingUser) {
    const contract = await this.prisma.rentalContract.findUnique({
      where: { id: contractId },
      include: {
        customer: { select: { nome: true, email: true } },
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
}
