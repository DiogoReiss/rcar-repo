import {
  BadRequestException,
  ForbiddenException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { SignaturesService } from './signatures.service';
import { FakeSignatureProvider } from './fake-signature.provider';
import { computeWebhookSignature } from './webhook-signature.util';

const SECRET = 'dev-signature-secret';

describe('SignaturesService', () => {
  const baseContract = {
    id: 'abcd1234-0000-0000-0000-000000000000',
    d4signId: null,
    d4signStatus: null,
    signedDocumentKey: null,
    valorTotal: 500,
    customer: {
      nome: 'Cliente',
      email: 'cliente@rcar.com.br',
      telefone: null,
    },
    vehicle: { placa: 'ABC1D23', modelo: 'Onix' },
  };

  const makePrisma = (contract: unknown) => ({
    rentalContract: {
      findUnique: jest.fn().mockResolvedValue(contract),
      findFirst: jest.fn().mockResolvedValue(contract),
      update: jest.fn().mockImplementation(({ data }: never) =>
        Promise.resolve({
          id: baseContract.id,
          d4signId: (data as { d4signId?: string }).d4signId,
          d4signStatus: (data as { d4signStatus?: string }).d4signStatus,
        }),
      ),
    },
    template: {
      findFirst: jest.fn().mockResolvedValue({ id: 'tpl-1' }),
    },
    webhookEvent: {
      create: jest.fn().mockResolvedValue({ id: 'w1' }),
    },
  });

  const documents = {
    generateTemplatePdf: jest.fn().mockResolvedValue({
      buffer: Buffer.from('pdf'),
      fileName: 'c.pdf',
      size: 3,
    }),
  };
  const storage = {
    putObject: jest.fn().mockResolvedValue('signed-contracts/abc.pdf'),
    getSignedUrlForKey: jest
      .fn()
      .mockResolvedValue({ signedUrl: 'https://signed', expiresAt: 'later' }),
  };
  const notifications = { notify: jest.fn().mockResolvedValue('EMAIL') };
  const config = { get: jest.fn((_k: string, def?: unknown) => def) };
  const audit = { record: jest.fn().mockResolvedValue(undefined) };

  const build = (prisma: unknown, provider = new FakeSignatureProvider()) =>
    new SignaturesService(
      prisma as never,
      documents as never,
      storage as never,
      audit as never,
      notifications as never,
      config as never,
      provider,
    );

  beforeEach(() => jest.clearAllMocks());

  it('sends the contract for signature, persists status and emails an invite', async () => {
    const prisma = makePrisma(baseContract);
    const service = build(prisma);

    const result = await service.sendForSignature(baseContract.id, {
      id: 'u1',
    });

    expect(documents.generateTemplatePdf).toHaveBeenCalled();
    expect(result.status).toBe('PENDING');
    expect(result.externalId).toMatch(/^fake-sig-/);
    expect(notifications.notify).toHaveBeenCalledWith(
      'EMAIL',
      expect.objectContaining({ recipient: expect.anything() }),
    );
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ acao: 'SIGNATURE_SENT' }),
    );
  });

  it('surfaces a clear error when the provider is unavailable', async () => {
    const failing = {
      ...baseContract,
      id: 'FAILabcd-0000-0000-0000-000000000000',
    };
    const prisma = makePrisma(failing);
    const service = build(prisma);

    await expect(service.sendForSignature(failing.id)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(prisma.rentalContract.update).not.toHaveBeenCalled();
  });

  it('rejects sending an already signed contract', async () => {
    const signed = { ...baseContract, d4signStatus: 'SIGNED' };
    const service = build(makePrisma(signed));

    await expect(service.sendForSignature(signed.id)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects a webhook with an invalid signature', async () => {
    const service = build(makePrisma(baseContract));

    await expect(
      service.handleWebhook(
        { eventId: 'e1', externalId: 'fake-sig-1', status: 'SIGNED' },
        'wrong-signature',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('processes an authenticated SIGNED webhook and stores the signed document', async () => {
    const contract = { ...baseContract, d4signId: 'fake-sig-1' };
    const prisma = makePrisma(contract);
    const service = build(prisma);
    const sig = computeWebhookSignature(SECRET, {
      eventId: 'e1',
      externalId: 'fake-sig-1',
      status: 'SIGNED',
    });

    const res = await service.handleWebhook(
      { eventId: 'e1', externalId: 'fake-sig-1', status: 'SIGNED' },
      sig,
    );

    expect(res).toMatchObject({ received: true, status: 'SIGNED' });
    expect(storage.putObject).toHaveBeenCalled();
    expect(prisma.rentalContract.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ d4signStatus: 'SIGNED' }),
      }),
    );
    expect(notifications.notify).toHaveBeenCalled();
  });

  it('is idempotent: a duplicate webhook does not re-apply effects', async () => {
    const contract = { ...baseContract, d4signId: 'fake-sig-1' };
    const prisma = makePrisma(contract);
    prisma.webhookEvent.create.mockRejectedValueOnce(
      new Error('Unique constraint failed'),
    );
    const service = build(prisma);
    const sig = computeWebhookSignature(SECRET, {
      eventId: 'e1',
      externalId: 'fake-sig-1',
      status: 'SIGNED',
    });

    const res = await service.handleWebhook(
      { eventId: 'e1', externalId: 'fake-sig-1', status: 'SIGNED' },
      sig,
    );

    expect(res).toMatchObject({ received: true, duplicate: true });
    expect(prisma.rentalContract.update).not.toHaveBeenCalled();
    expect(storage.putObject).not.toHaveBeenCalled();
  });
});
