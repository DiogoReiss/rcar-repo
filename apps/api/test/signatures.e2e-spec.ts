import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ExecutionContext } from '@nestjs/common';
import request from 'supertest';
import { SignaturesController } from '../src/modules/signatures/signatures.controller';
import { SignaturesService } from '../src/modules/signatures/signatures.service';
import { FakeSignatureProvider } from '../src/modules/signatures/fake-signature.provider';
import { SIGNATURE_PROVIDER } from '../src/modules/signatures/signature-provider';
import { PrismaService } from '../src/prisma/prisma.service';
import { DocumentsService } from '../src/modules/documents/documents.service';
import { AuditService } from '../src/common/audit/audit.service';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { Reflector } from '@nestjs/core';

const HAPPY_ID = 'abcd1234-0000-4000-8000-000000000000';
const FAIL_ID = 'ffff1234-0000-4000-8000-000000000000';

describe('Signatures boundary (e2e)', () => {
  let app: INestApplication;
  const actingRole = { value: 'OPERADOR' };

  const contracts: Record<string, unknown> = {
    [HAPPY_ID]: {
      id: HAPPY_ID,
      d4signId: null,
      d4signStatus: null,
      valorTotal: 500,
      customer: { nome: 'Cliente', email: 'c@rcar.com.br' },
      vehicle: { placa: 'ABC1D23', modelo: 'Onix' },
    },
    [FAIL_ID]: {
      id: FAIL_ID,
      d4signId: null,
      d4signStatus: null,
      valorTotal: 500,
      customer: { nome: 'Cliente', email: 'fail@rcar.com.br' },
      vehicle: { placa: 'ABC1D23', modelo: 'Onix' },
    },
  };

  const prisma = {
    rentalContract: {
      findUnique: jest.fn(({ where }: { where: { id: string } }) =>
        Promise.resolve(contracts[where.id] ?? null),
      ),
      update: jest.fn(({ where, data }: never) =>
        Promise.resolve({
          id: (where as { id: string }).id,
          d4signId: (data as { d4signId: string }).d4signId,
          d4signStatus: (data as { d4signStatus: string }).d4signStatus,
        }),
      ),
    },
    template: { findFirst: jest.fn().mockResolvedValue({ id: 'tpl-1' }) },
  };
  const documents = {
    generateTemplatePdf: jest.fn().mockResolvedValue({
      buffer: Buffer.from('pdf'),
      fileName: 'c.pdf',
      size: 3,
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [SignaturesController],
      providers: [
        SignaturesService,
        Reflector,
        RolesGuard,
        { provide: SIGNATURE_PROVIDER, useClass: FakeSignatureProvider },
        { provide: PrismaService, useValue: prisma },
        { provide: DocumentsService, useValue: documents },
        { provide: AuditService, useValue: { record: jest.fn() } },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (ctx: ExecutionContext) => {
          ctx.switchToHttp().getRequest().user = {
            id: 'u1',
            role: actingRole.value,
          };
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => app?.close());

  it('OPERADOR sends contract for signature (happy path)', async () => {
    actingRole.value = 'OPERADOR';
    const res = await request(app.getHttpServer())
      .post(`/signatures/contracts/${HAPPY_ID}/send`)
      .expect(200);
    expect(res.body.status).toBe('PENDING');
    expect(res.body.externalId).toMatch(/^fake-sig-/);
  });

  it('OPERADOR_LEITURA can read status but cannot send', async () => {
    actingRole.value = 'OPERADOR_LEITURA';
    await request(app.getHttpServer())
      .get(`/signatures/contracts/${HAPPY_ID}`)
      .expect(200);
    await request(app.getHttpServer())
      .post(`/signatures/contracts/${HAPPY_ID}/send`)
      .expect(403);
  });

  it('surfaces provider failure (503)', async () => {
    actingRole.value = 'OPERADOR';
    await request(app.getHttpServer())
      .post(`/signatures/contracts/${FAIL_ID}/send`)
      .expect(503);
  });
});
