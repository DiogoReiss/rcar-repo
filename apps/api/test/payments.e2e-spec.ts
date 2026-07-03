import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ExecutionContext,
  ValidationPipe,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import { PaymentsController } from '../src/modules/payments/payments.controller';
import { PaymentWebhookController } from '../src/modules/payments/payment-webhook.controller';
import { PaymentsService } from '../src/modules/payments/payments.service';
import { FakePaymentGateway } from '../src/modules/payments/fake-payment.gateway';
import { PAYMENT_GATEWAY } from '../src/modules/payments/payment-gateway';
import { NotificationsService } from '../src/modules/notifications/notifications.service';
import { hmacSignature } from '../src/common/webhooks/webhook-signature.util';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuditService } from '../src/common/audit/audit.service';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../src/common/guards/roles.guard';

const OK_CONTRACT = 'aaaa1234-0000-4000-8000-000000000000';
const REFUSE_CONTRACT = 'bbbb1234-0000-4000-8000-000000000000';
const REFUND_PAYMENT = 'cccc1234-0000-4000-8000-000000000000';
const WEBHOOK_SECRET = 'dev-payment-secret';

describe('Payments boundary (e2e)', () => {
  let app: INestApplication;
  const actingRole = { value: 'OPERADOR' };

  const contracts: Record<string, unknown> = {
    [OK_CONTRACT]: {
      id: OK_CONTRACT,
      customerId: 'cust1',
      valorTotal: 300,
      valorTotalReal: null,
      customer: { id: 'cust1', nome: 'Cliente' },
    },
    [REFUSE_CONTRACT]: {
      id: REFUSE_CONTRACT,
      customerId: 'cust1',
      valorTotal: 300,
      valorTotalReal: null,
      customer: { id: 'cust1', nome: 'Cliente Recusa' },
    },
  };

  const webhookEventSeen = new Set<string>();
  const pendingPayment: { status: string } = { status: 'PENDENTE' };

  const prisma = {
    rentalContract: {
      findUnique: jest.fn(({ where }: { where: { id: string } }) =>
        Promise.resolve(contracts[where.id] ?? null),
      ),
    },
    webhookEvent: {
      create: jest.fn(({ data }: { data: { eventId: string } }) => {
        if (webhookEventSeen.has(data.eventId)) {
          return Promise.reject(new Error('unique'));
        }
        webhookEventSeen.add(data.eventId);
        return Promise.resolve({});
      }),
    },
    payment: {
      findFirst: jest.fn(({ where }: { where: Record<string, unknown> }) => {
        if (where.pagarmeTxId === 'tx-webhook') {
          return Promise.resolve({
            id: 'pay-webhook',
            status: pendingPayment.status,
            valor: 300,
            metodo: 'PIX',
            pagarmeTxId: 'tx-webhook',
            customer: { nome: 'Cliente', email: 'c@x.com', telefone: null },
          });
        }
        return Promise.resolve(null);
      }),
      aggregate: jest.fn().mockResolvedValue({ _sum: { valor: 0 } }),
      findUnique: jest.fn(({ where }: { where: { id: string } }) => {
        if (where.id === REFUND_PAYMENT) {
          return Promise.resolve({
            id: REFUND_PAYMENT,
            status: 'CONFIRMADO',
            pagarmeTxId: 'tx-refund',
          });
        }
        return Promise.resolve(null);
      }),
      update: jest.fn(({ where, data }: { where: { id: string }; data: { status: string } }) => {
        if (where.id !== REFUND_PAYMENT) {
          pendingPayment.status = data.status;
        }
        return Promise.resolve({ id: where.id, ...data });
      }),
      create: jest.fn(({ data }: never) =>
        Promise.resolve({ id: 'pay1', ...(data as object) }),
      ),
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController, PaymentWebhookController],
      providers: [
        PaymentsService,
        Reflector,
        RolesGuard,
        { provide: PAYMENT_GATEWAY, useClass: FakePaymentGateway },
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: { record: jest.fn() } },
        { provide: NotificationsService, useValue: { notify: jest.fn() } },
        {
          provide: ConfigService,
          useValue: { get: (_k: string, def: string) => def },
        },
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

  it('OPERADOR starts a Pix charge (happy path)', async () => {
    actingRole.value = 'OPERADOR';
    const res = await request(app.getHttpServer())
      .post('/payments/charges')
      .send({ refType: 'RENTAL_CONTRACT', refId: OK_CONTRACT, metodo: 'PIX' })
      .expect(201);
    expect(res.body.status).toBe('PENDENTE');
    expect(res.body.pagarmeTxId).toMatch(/^fake-pix-/);
  });

  it('OPERADOR_LEITURA cannot start a charge', async () => {
    actingRole.value = 'OPERADOR_LEITURA';
    await request(app.getHttpServer())
      .post('/payments/charges')
      .send({ refType: 'RENTAL_CONTRACT', refId: OK_CONTRACT, metodo: 'PIX' })
      .expect(403);
  });

  it('returns a clear error when the gateway refuses (400)', async () => {
    actingRole.value = 'OPERADOR';
    await request(app.getHttpServer())
      .post('/payments/charges')
      .send({
        refType: 'RENTAL_CONTRACT',
        refId: REFUSE_CONTRACT,
        metodo: 'PIX',
      })
      .expect(400);
  });

  describe('webhook (public, HMAC, idempotent)', () => {
    const dto = {
      eventId: 'evt-webhook-1',
      externalId: 'tx-webhook',
      status: 'CONFIRMED' as const,
    };
    const sign = (d: typeof dto) =>
      hmacSignature(WEBHOOK_SECRET, `${d.eventId}.${d.externalId}.${d.status}`);

    it('rejects an unsigned/invalid webhook (403)', async () => {
      await request(app.getHttpServer())
        .post('/payments/webhook')
        .set('x-webhook-signature', 'invalid')
        .send(dto)
        .expect(403);
    });

    it('confirms the payment on a valid webhook (200)', async () => {
      const res = await request(app.getHttpServer())
        .post('/payments/webhook')
        .set('x-webhook-signature', sign(dto))
        .send(dto)
        .expect(200);
      expect(res.body.status).toBe('CONFIRMADO');
    });

    it('is idempotent on a duplicate event (200, no re-apply)', async () => {
      const res = await request(app.getHttpServer())
        .post('/payments/webhook')
        .set('x-webhook-signature', sign(dto))
        .send(dto)
        .expect(200);
      expect(res.body.duplicate).toBe(true);
    });
  });

  describe('balance and refund', () => {
    it('returns the outstanding balance of a payable', async () => {
      actingRole.value = 'OPERADOR';
      const res = await request(app.getHttpServer())
        .get('/payments/balance')
        .query({ refType: 'RENTAL_CONTRACT', refId: OK_CONTRACT })
        .expect(200);
      expect(res.body).toMatchObject({ total: 300, pago: 0, saldo: 300 });
    });

    it('GESTOR_GERAL refunds a confirmed payment', async () => {
      actingRole.value = 'GESTOR_GERAL';
      const res = await request(app.getHttpServer())
        .post(`/payments/charges/${REFUND_PAYMENT}/refund`)
        .expect(200);
      expect(res.body.status).toBe('CANCELADO');
    });

    it('OPERADOR cannot refund a payment (403)', async () => {
      actingRole.value = 'OPERADOR';
      await request(app.getHttpServer())
        .post(`/payments/charges/${REFUND_PAYMENT}/refund`)
        .expect(403);
    });
  });
});
