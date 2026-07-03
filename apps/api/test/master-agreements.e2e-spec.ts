import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ExecutionContext,
  ValidationPipe,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { MasterAgreementsController } from '../src/modules/master-agreements/master-agreements.controller';
import { MasterAgreementsService } from '../src/modules/master-agreements/master-agreements.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuditService } from '../src/common/audit/audit.service';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../src/common/guards/roles.guard';

const CUST = 'aaaa1234-0000-4000-8000-000000000000';
const VEH = 'cccc1234-0000-4000-8000-000000000000';

describe('Master Agreements boundary (e2e)', () => {
  let app: INestApplication;
  const actingRole = { value: 'GESTOR_GERAL' };

  const prisma = {
    customer: { findUnique: jest.fn().mockResolvedValue({ id: CUST }) },
    masterAgreement: {
      create: jest.fn().mockResolvedValue({ id: 'a1', items: [{ id: 'i1' }] }),
      findMany: jest.fn().mockResolvedValue([]),
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [MasterAgreementsController],
      providers: [
        MasterAgreementsService,
        Reflector,
        RolesGuard,
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

  it('GESTOR_GERAL creates a master agreement', async () => {
    actingRole.value = 'GESTOR_GERAL';
    const res = await request(app.getHttpServer())
      .post('/master-agreements')
      .send({
        customerId: CUST,
        ciclo: 'MENSAL',
        items: [{ vehicleId: VEH, valorCiclo: 1000 }],
      })
      .expect(201);
    expect(res.body.id).toBe('a1');
  });

  it('OPERADOR is forbidden (manager-only)', async () => {
    actingRole.value = 'OPERADOR';
    await request(app.getHttpServer())
      .post('/master-agreements')
      .send({ customerId: CUST, ciclo: 'MENSAL' })
      .expect(403);
    await request(app.getHttpServer()).get('/master-agreements').expect(403);
  });
});
