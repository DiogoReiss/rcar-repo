import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

describe('Roles & Permissions (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let gestorToken: string;
  let operadorToken: string;
  let operadorLeituraToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);

    // Create test users
    const senhaHash = await bcrypt.hash('test123', 10);

    await prisma.user.upsert({
      where: { email: 'gestor-test@rcar.com.br' },
      update: {},
      create: {
        nome: 'Gestor Test',
        email: 'gestor-test@rcar.com.br',
        senhaHash,
        role: 'GESTOR_GERAL',
      },
    });

    await prisma.user.upsert({
      where: { email: 'operador-test@rcar.com.br' },
      update: {},
      create: {
        nome: 'Operador Test',
        email: 'operador-test@rcar.com.br',
        senhaHash,
        role: 'OPERADOR',
      },
    });

    await prisma.user.upsert({
      where: { email: 'leitura-test@rcar.com.br' },
      update: {},
      create: {
        nome: 'Leitura Test',
        email: 'leitura-test@rcar.com.br',
        senhaHash,
        role: 'OPERADOR_LEITURA',
      },
    });

    // Get tokens
    const gestorRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'gestor-test@rcar.com.br', senha: 'test123' });
    gestorToken = gestorRes.body.accessToken;

    const operadorRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'operador-test@rcar.com.br', senha: 'test123' });
    operadorToken = operadorRes.body.accessToken;

    const leituraRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'leitura-test@rcar.com.br', senha: 'test123' });
    operadorLeituraToken = leituraRes.body.accessToken;
  });

  afterAll(async () => {
    // Cleanup test users
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            'gestor-test@rcar.com.br',
            'operador-test@rcar.com.br',
            'leitura-test@rcar.com.br',
          ],
        },
      },
    });

    if (app) {
      await app.close();
    }
  });

  describe('GESTOR_GERAL role', () => {
    it('should access users list', async () => {
      return request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', `Bearer ${gestorToken}`)
        .expect(HttpStatus.OK);
    });

    it('should create a user', async () => {
      return request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${gestorToken}`)
        .send({
          nome: 'Test User',
          email: `test-${Date.now()}@rcar.com.br`,
          senha: 'test123',
          role: 'OPERADOR',
        })
        .expect(HttpStatus.CREATED);
    });
  });

  describe('OPERADOR role', () => {
    it('should access schedules list (read)', async () => {
      return request(app.getHttpServer())
        .get('/api/lavajato/schedules')
        .set('Authorization', `Bearer ${operadorToken}`)
        .expect(HttpStatus.OK);
    });

    it('should NOT access users management', async () => {
      return request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', `Bearer ${operadorToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });
  });

  describe('OPERADOR_LEITURA role', () => {
    it('should access schedules list (read)', async () => {
      return request(app.getHttpServer())
        .get('/api/lavajato/schedules')
        .set('Authorization', `Bearer ${operadorLeituraToken}`)
        .expect(HttpStatus.OK);
    });

    it('should access queue list (read)', async () => {
      return request(app.getHttpServer())
        .get('/api/lavajato/queue')
        .set('Authorization', `Bearer ${operadorLeituraToken}`)
        .expect(HttpStatus.OK);
    });

    it('should NOT access users management', async () => {
      return request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', `Bearer ${operadorLeituraToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should NOT create schedules (write)', async () => {
      return request(app.getHttpServer())
        .post('/api/lavajato/schedules')
        .set('Authorization', `Bearer ${operadorLeituraToken}`)
        .send({
          serviceId: 'test',
          dataHora: new Date().toISOString(),
        })
        .expect(HttpStatus.FORBIDDEN);
    });
  });
});
