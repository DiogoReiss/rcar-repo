/**
 * Single outbound port for digital signatures. External providers (e.g. D4Sign)
 * are just adapters of this port; tests/dev use {@link FakeSignatureProvider}.
 */

export const SIGNATURE_PROVIDER = 'SIGNATURE_PROVIDER';

export type SignatureStatus = 'PENDING' | 'SIGNED' | 'CANCELLED' | 'EXPIRED';

export interface CreateSignatureRequest {
  contractId: string;
  documentName: string;
  content: Buffer;
  signerName?: string;
  signerEmail?: string;
}

export interface SignatureRequestResult {
  externalId: string;
  status: SignatureStatus;
}

export interface SignatureStatusResult {
  externalId: string;
  status: SignatureStatus;
  signedDocumentKey?: string;
}

export abstract class SignatureProvider {
  abstract createSignatureRequest(
    request: CreateSignatureRequest,
  ): Promise<SignatureRequestResult>;

  abstract getStatus(externalId: string): Promise<SignatureStatusResult>;

  abstract getSignedDocument(externalId: string): Promise<Buffer>;

  abstract cancel(externalId: string): Promise<void>;
}
