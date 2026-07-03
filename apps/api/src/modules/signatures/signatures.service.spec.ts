import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { SignaturesService } from './signatures.service';
import { FakeSignatureProvider } from './fake-signature.provider';

describe('SignaturesService', () => {
  const baseContract = {
    id: 'abcd1234-0000-0000-0000-000000000000',
    d4signId: null,
    d4signStatus: null,
    valorTotal: 500,
    customer: { nome: 'Cliente', email: 'cliente@rcar.com.br' },
    vehicle: { placa: 'ABC1D23', modelo: 'Onix' },
  };

  const makePrisma = (contract: unknown) => ({
    rentalContract: {
      findUnique: jest.fn().mockResolvedValue(contract),
      update: jest.fn().mockImplementation(({ data }: never) =>
        Promise.resolve({
          id: baseContract.id,
          d4signId: (data as { d4signId: string }).d4signId,
          d4signStatus: (data as { d4signStatus: string }).d4signStatus,
        }),
      ),
    },
    template: {
      findFirst: jest.fn().mockResolvedValue({ id: 'tpl-1' }),
    },
  });

  const documents = {
    generateTemplatePdf: jest.fn().mockResolvedValue({
      buffer: Buffer.from('pdf'),
      fileName: 'c.pdf',
      size: 3,
    }),
  };
  const audit = { record: jest.fn().mockResolvedValue(undefined) };

  beforeEach(() => jest.clearAllMocks());

  it('sends the contract for signature and persists status + external id', async () => {
    const prisma = makePrisma(baseContract);
    const provider = new FakeSignatureProvider();
    const service = new SignaturesService(
      prisma as never,
      documents as never,
      audit as never,
      provider,
    );

    const result = await service.sendForSignature(baseContract.id, {
      id: 'u1',
    });

    expect(documents.generateTemplatePdf).toHaveBeenCalled();
    expect(result.status).toBe('PENDING');
    expect(result.externalId).toMatch(/^fake-sig-/);
    expect(prisma.rentalContract.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ d4signStatus: 'PENDING' }),
      }),
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
    const provider = new FakeSignatureProvider();
    const service = new SignaturesService(
      prisma as never,
      documents as never,
      audit as never,
      provider,
    );

    await expect(service.sendForSignature(failing.id)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(prisma.rentalContract.update).not.toHaveBeenCalled();
  });

  it('rejects sending an already signed contract', async () => {
    const signed = { ...baseContract, d4signStatus: 'SIGNED' };
    const prisma = makePrisma(signed);
    const service = new SignaturesService(
      prisma as never,
      documents as never,
      audit as never,
      new FakeSignatureProvider(),
    );

    await expect(service.sendForSignature(signed.id)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
