import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ExecutionContext,
  ValidationPipe,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { PaymentsController } from '../src/modules/payments/payments.controller';
import { PaymentsService } from '../src/modules/payments/payments.service';
import { FakePaymentGateway } from '../src/modules/payments/fake-payment.gateway';
import { PAYMENT_GATEWAY } from '../src/modules/payments/payment-gateway';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuditService } from '../src/common/audit/audit.service';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../src/common/guards/roles.guard';

const OK_CONTRACT = 'aaaa1234-0000-4000-8000-000000000000';
const REFUSE_CONTRACT = 'bbbb1234-0000-4000-8000-000000000000';

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

  const prisma = {
    rentalContract: {
      findUnique: jest.fn(({ where }: { where: { id: string } }) =>
        Promise.resolve(contracts[where.id] ?? null),
      ),
    },
    payment: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn(({ data }: never) =>
        Promise.resolve({ id: 'pay1', ...(data as object) }),
      ),
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        PaymentsService,
        Reflector,
        RolesGuard,
        { provide: PAYMENT_GATEWAY, useClass: FakePaymentGateway },
        { provide: PrismaService, useValue: prisma },
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
});
