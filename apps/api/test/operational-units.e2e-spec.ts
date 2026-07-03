import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ExecutionContext,
  ValidationPipe,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { OperationalUnitsController } from '../src/modules/operational-units/operational-units.controller';
import { OperationalUnitsService } from '../src/modules/operational-units/operational-units.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuditService } from '../src/common/audit/audit.service';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../src/common/guards/roles.guard';

describe('Operational Units boundary (e2e)', () => {
  let app: INestApplication;
  const acting = { role: 'GESTOR_GERAL', unidadeId: null as string | null };

  const prisma = {
    operationalUnit: {
      create: jest.fn().mockResolvedValue({ id: 'u1', codigo: 'SP01' }),
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [OperationalUnitsController],
      providers: [
        OperationalUnitsService,
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
            role: acting.role,
            unidadeId: acting.unidadeId,
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

  beforeEach(() => jest.clearAllMocks());

  it('GESTOR_GERAL creates a unit', async () => {
    acting.role = 'GESTOR_GERAL';
    acting.unidadeId = null;
    const res = await request(app.getHttpServer())
      .post('/operational-units')
      .send({ nome: 'São Paulo Centro', codigo: 'SP01' })
      .expect(201);
    expect(res.body.id).toBe('u1');
  });

  it('OPERADOR is forbidden from creating units (manager-only)', async () => {
    acting.role = 'OPERADOR';
    acting.unidadeId = 'unit-a';
    await request(app.getHttpServer())
      .post('/operational-units')
      .send({ nome: 'Filial', codigo: 'RJ01' })
      .expect(403);
  });

  it('OPERADOR listing is scoped to their own unit', async () => {
    acting.role = 'OPERADOR';
    acting.unidadeId = 'unit-a';
    await request(app.getHttpServer()).get('/operational-units').expect(200);
    expect(prisma.operationalUnit.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'unit-a', deletedAt: null } }),
    );
  });
});
