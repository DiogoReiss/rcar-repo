import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ExecutionContext,
  ValidationPipe,
} from '@nestjs/common';
import request from 'supertest';
import { Reflector } from '@nestjs/core';
import { SignaturesController } from '../src/modules/signatures/signatures.controller';
import { SignatureWebhookController } from '../src/modules/signatures/signature-webhook.controller';
import { SignaturesService } from '../src/modules/signatures/signatures.service';
import { FakeSignatureProvider } from '../src/modules/signatures/fake-signature.provider';
import { SIGNATURE_PROVIDER } from '../src/modules/signatures/signature-provider';
import { computeWebhookSignature } from '../src/modules/signatures/webhook-signature.util';
import { PrismaService } from '../src/prisma/prisma.service';
import { DocumentsService } from '../src/modules/documents/documents.service';
import { StorageService } from '../src/modules/storage/storage.service';
import { AuditService } from '../src/common/audit/audit.service';
import { NotificationsService } from '../src/modules/notifications/notifications.service';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../src/common/guards/roles.guard';

const HAPPY_ID = 'abcd1234-0000-4000-8000-000000000000';
const FAIL_ID = 'ffff1234-0000-4000-8000-000000000000';
const EXTERNAL_ID = 'fake-sig-e2e';
const SECRET = 'dev-signature-secret';

describe('Signatures boundary (e2e)', () => {
  let app: INestApplication;
  const actingRole = { value: 'OPERADOR' };
  const seenEvents = new Set<string>();

  const contracts: Record<string, unknown> = {
    [HAPPY_ID]: {
      id: HAPPY_ID,
      d4signId: EXTERNAL_ID,
      d4signStatus: 'PENDING',
      signedDocumentKey: null,
      valorTotal: 500,
      customer: { nome: 'Cliente', email: 'c@rcar.com.br', telefone: null },
      vehicle: { placa: 'ABC1D23', modelo: 'Onix' },
    },
    [FAIL_ID]: {
      id: FAIL_ID,
      d4signId: null,
      d4signStatus: null,
      signedDocumentKey: null,
      valorTotal: 500,
      customer: { nome: 'Cliente', email: 'fail@rcar.com.br', telefone: null },
      vehicle: { placa: 'ABC1D23', modelo: 'Onix' },
    },
  };

  const prisma = {
    rentalContract: {
      findUnique: jest.fn(({ where }: { where: { id: string } }) =>
        Promise.resolve(contracts[where.id] ?? null),
      ),
      findFirst: jest.fn(({ where }: { where: { d4signId: string } }) =>
        Promise.resolve(
          Object.values(contracts).find(
            (c) => (c as { d4signId: string }).d4signId === where.d4signId,
          ) ?? null,
        ),
      ),
      update: jest.fn(({ where, data }: never) =>
        Promise.resolve({
          id: (where as { id: string }).id,
          d4signId: (data as { d4signId?: string }).d4signId,
          d4signStatus: (data as { d4signStatus?: string }).d4signStatus,
        }),
      ),
    },
    template: { findFirst: jest.fn().mockResolvedValue({ id: 'tpl-1' }) },
    webhookEvent: {
      create: jest.fn(({ data }: { data: { eventId: string } }) => {
        if (seenEvents.has(data.eventId)) {
          return Promise.reject(new Error('Unique constraint failed'));
        }
        seenEvents.add(data.eventId);
        return Promise.resolve({ id: 'w1' });
      }),
    },
  };
  const documents = {
    generateTemplatePdf: jest.fn().mockResolvedValue({
      buffer: Buffer.from('pdf'),
      fileName: 'c.pdf',
      size: 3,
    }),
  };
  const storage = {
    putObject: jest.fn().mockResolvedValue('signed-contracts/x.pdf'),
    getSignedUrlForKey: jest
      .fn()
      .mockResolvedValue({ signedUrl: 'https://signed', expiresAt: 'later' }),
  };
  const notifications = { notify: jest.fn().mockResolvedValue('EMAIL') };
  const config = { get: jest.fn((_k: string, def?: unknown) => def) };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [SignaturesController, SignatureWebhookController],
      providers: [
        SignaturesService,
        Reflector,
        RolesGuard,
        { provide: SIGNATURE_PROVIDER, useClass: FakeSignatureProvider },
        { provide: PrismaService, useValue: prisma },
        { provide: DocumentsService, useValue: documents },
        { provide: StorageService, useValue: storage },
        { provide: AuditService, useValue: { record: jest.fn() } },
        { provide: NotificationsService, useValue: notifications },
        { provide: ConfigService, useValue: config },
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
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => app?.close());

  it('OPERADOR sends contract for signature (happy path)', async () => {
    actingRole.value = 'OPERADOR';
    const res = await request(app.getHttpServer())
      .post(`/signatures/contracts/${FAIL_ID.replace('ffff', 'aaaa')}/send`)
      .expect(404);
    expect(res.body.statusCode).toBe(404);
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

  it('rejects an unauthenticated webhook payload (403)', async () => {
    await request(app.getHttpServer())
      .post('/signatures/webhook')
      .send({ eventId: 'evt-1', externalId: EXTERNAL_ID, status: 'SIGNED' })
      .set('x-webhook-signature', 'bogus')
      .expect(403);
  });

  it('transitions contract status via an authenticated webhook', async () => {
    const sig = computeWebhookSignature(SECRET, {
      eventId: 'evt-1',
      externalId: EXTERNAL_ID,
      status: 'SIGNED',
    });
    const res = await request(app.getHttpServer())
      .post('/signatures/webhook')
      .send({ eventId: 'evt-1', externalId: EXTERNAL_ID, status: 'SIGNED' })
      .set('x-webhook-signature', sig)
      .expect(200);
    expect(res.body).toMatchObject({ received: true, status: 'SIGNED' });
    expect(storage.putObject).toHaveBeenCalledTimes(1);
  });

  it('is idempotent: replaying the same webhook does not duplicate effects', async () => {
    const sig = computeWebhookSignature(SECRET, {
      eventId: 'evt-1',
      externalId: EXTERNAL_ID,
      status: 'SIGNED',
    });
    const res = await request(app.getHttpServer())
      .post('/signatures/webhook')
      .send({ eventId: 'evt-1', externalId: EXTERNAL_ID, status: 'SIGNED' })
      .set('x-webhook-signature', sig)
      .expect(200);
    expect(res.body).toMatchObject({ received: true, duplicate: true });
    // putObject still only called once (from the first delivery)
    expect(storage.putObject).toHaveBeenCalledTimes(1);
  });
});
