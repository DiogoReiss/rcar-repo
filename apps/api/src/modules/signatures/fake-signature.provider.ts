import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  CreateSignatureRequest,
  SignatureProvider,
  SignatureRequestResult,
  SignatureStatus,
  SignatureStatusResult,
} from './signature-provider.js';

interface FakeEnvelope {
  externalId: string;
  contractId: string;
  documentName: string;
  content: Buffer;
  status: SignatureStatus;
}

/**
 * In-memory signature provider used for dev/testing. Simulates the outbound
 * behaviour of a real provider (e.g. D4Sign) without any network calls.
 *
 * A document whose name contains "FAIL" makes the provider throw, so callers
 * can exercise the "provider unavailable" path deterministically.
 */
@Injectable()
export class FakeSignatureProvider extends SignatureProvider {
  private readonly envelopes = new Map<string, FakeEnvelope>();

  createSignatureRequest(
    request: CreateSignatureRequest,
  ): Promise<SignatureRequestResult> {
    if (
      /FAIL/i.test(request.documentName) ||
      /fail/i.test(request.signerEmail ?? '')
    ) {
      throw new ServiceUnavailableException(
        'Provedor de assinatura indisponível (simulado).',
      );
    }
    const externalId = `fake-sig-${randomUUID()}`;
    this.envelopes.set(externalId, {
      externalId,
      contractId: request.contractId,
      documentName: request.documentName,
      content: request.content,
      status: 'PENDING',
    });
    return Promise.resolve({ externalId, status: 'PENDING' });
  }

  getStatus(externalId: string): Promise<SignatureStatusResult> {
    const envelope = this.envelopes.get(externalId);
    return Promise.resolve({
      externalId,
      status: envelope?.status ?? 'PENDING',
      signedDocumentKey:
        envelope?.status === 'SIGNED' ? `signed/${externalId}.pdf` : undefined,
    });
  }

  getSignedDocument(externalId: string): Promise<Buffer> {
    const envelope = this.envelopes.get(externalId);
    return Promise.resolve(envelope?.content ?? Buffer.from(''));
  }

  cancel(externalId: string): Promise<void> {
    const envelope = this.envelopes.get(externalId);
    if (envelope) envelope.status = 'CANCELLED';
    return Promise.resolve();
  }

  /** Test helper: force a status transition as if the provider notified us. */
  __setStatus(externalId: string, status: SignatureStatus): void {
    const envelope = this.envelopes.get(externalId);
    if (envelope) envelope.status = status;
  }
}
