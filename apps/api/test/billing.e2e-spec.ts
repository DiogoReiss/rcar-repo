import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ExecutionContext,
  ValidationPipe,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { BillingController } from '../src/modules/master-agreements/billing.controller';
import { BillingService } from '../src/modules/master-agreements/billing.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuditService } from '../src/common/audit/audit.service';
import { NotificationsService } from '../src/modules/notifications/notifications.service';
import { PAYMENT_GATEWAY } from '../src/modules/payments/payment-gateway';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../src/common/guards/roles.guard';

const AGREEMENT = 'aaaa1234-0000-4000-8000-000000000000';

describe('Billing boundary (e2e)', () => {
  let app: INestApplication;
  const actingRole = { value: 'GESTOR_GERAL' };

  const agreement = {
    id: AGREEMENT,
    customerId: 'cust1',
    ciclo: 'MENSAL',
    status: 'ATIVO',
    diaVencimento: 10,
    proximoCiclo: new Date('2026-07-10T00:00:00Z'),
    customer: {
      id: 'cust1',
      nome: 'Cliente',
      email: 'c@x.com',
      telefone: null,
      canalPreferido: 'EMAIL',
    },
    items: [{ ativo: true, valorCiclo: 1500, vehicleId: 'v1' }],
  };

  const prisma = {
    masterAgreement: {
      findUnique: jest.fn().mockResolvedValue(agreement),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue({}),
    },
    payment: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'pay1', valor: 1500 }),
    },
  };

  const gateway = {
    createCharge: jest.fn().mockResolvedValue({
      externalId: 'ext-1',
      status: 'PENDING',
      boletoUrl: 'https://boleto/x',
    }),
    getStatus: jest.fn(),
    refund: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [BillingController],
      providers: [
        BillingService,
        Reflector,
        RolesGuard,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: { record: jest.fn() } },
        { provide: NotificationsService, useValue: { notify: jest.fn() } },
        { provide: PAYMENT_GATEWAY, useValue: gateway },
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

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => jest.clearAllMocks());

  it('previews the consolidated invoice for a manager', async () => {
    actingRole.value = 'GESTOR_GERAL';
    const res = await request(app.getHttpServer())
      .get(`/master-agreements/${AGREEMENT}/billing/preview`)
      .expect(200);
    expect(res.body.valorCiclo).toBe(1500);
  });

  it('generates a consolidated charge on manual trigger', async () => {
    actingRole.value = 'GESTOR_GERAL';
    const res = await request(app.getHttpServer())
      .post(`/master-agreements/${AGREEMENT}/billing/charge`)
      .expect(201);
    expect(res.body.created).toBe(true);
    expect(gateway.createCharge).toHaveBeenCalledTimes(1);
  });

  it('runs the recurring cycle', async () => {
    actingRole.value = 'GESTOR_GERAL';
    const res = await request(app.getHttpServer())
      .post('/master-agreements/billing/run')
      .expect(201);
    expect(res.body).toHaveProperty('processados');
  });

  it('forbids non-managers (RBAC enforced)', async () => {
    actingRole.value = 'OPERADOR_LAVAJATO';
    await request(app.getHttpServer())
      .get('/master-agreements/billing/reconciliation')
      .expect(403);
  });
});
