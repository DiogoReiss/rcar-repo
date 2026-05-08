import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { AuthService } from '../src/modules/auth/auth.service';
import { UsersService } from '../src/modules/users/users.service';
import { CustomersService } from '../src/modules/customers/customers.service';
import { FleetService } from '../src/modules/fleet/fleet.service';
import { WashService } from '../src/modules/wash/wash.service';
import { LavajatoService } from '../src/modules/lavajato/lavajato.service';
import { RentalService } from '../src/modules/rental/rental.service';
import { TemplatesService } from '../src/modules/templates/templates.service';
import { DocumentsService } from '../src/modules/documents/documents.service';
import { ReportsService } from '../src/modules/reports/reports.service';
import { PaymentsService } from '../src/modules/payments/payments.service';
import { InventoryService } from '../src/modules/inventory/inventory.service';
import { StorageService } from '../src/modules/storage/storage.service';

describe('API happy paths (e2e)', () => {
  let app: INestApplication<App>;

  const authService = {
    forgotPassword: jest.fn().mockResolvedValue({ message: 'ok' }),
  };
  const usersService = {
    findAll: jest.fn().mockResolvedValue([{ id: 'u1', nome: 'Admin' }]),
  };
  const customersService = {
    findAll: jest.fn().mockResolvedValue({ data: [{ id: 'c1', nome: 'Cliente' }], total: 1, page: 1, perPage: 20, totalPages: 1 }),
  };
  const fleetService = {
    findAll: jest.fn().mockResolvedValue({ data: [{ id: 'v1', placa: 'ABC1D23' }], total: 1, page: 1, perPage: 20, totalPages: 1 }),
  };
  const washService = {
    findAll: jest.fn().mockResolvedValue({ data: [{ id: 'ws1', nome: 'Lavagem' }], total: 1, page: 1, perPage: 20, totalPages: 1 }),
  };
  const lavajatoService = {
    getSchedules: jest.fn().mockResolvedValue([]),
  };
  const rentalService = {
    findAll: jest.fn().mockResolvedValue({ data: [], total: 0, page: 1, perPage: 20, totalPages: 0 }),
  };
  const templatesService = {
    findAll: jest.fn().mockResolvedValue([{ id: 't1', nome: 'Contrato' }]),
  };
  const documentsService = {
    generateTemplatePdf: jest.fn().mockResolvedValue({
      buffer: Buffer.from('%PDF-1.7\nmock'),
      fileName: 'documento.pdf',
      size: Buffer.byteLength('%PDF-1.7\nmock'),
    }),
  };
  const reportsService = {
    getDashboardKpis: jest.fn().mockResolvedValue({ usersCount: 1 }),
  };
  const paymentsService = {
    findAll: jest.fn().mockResolvedValue({ data: [], total: 0, page: 1, perPage: 20, totalPages: 0 }),
  };
  const inventoryService = {
    findAllProducts: jest.fn().mockResolvedValue({ data: [], total: 0, page: 1, perPage: 20, totalPages: 0 }),
  };
  const storageService = {
    getSignedDownloadUrl: jest.fn().mockResolvedValue({ signedUrl: 'https://storage.local/file' }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideProvider(AuthService)
      .useValue(authService)
      .overrideProvider(UsersService)
      .useValue(usersService)
      .overrideProvider(CustomersService)
      .useValue(customersService)
      .overrideProvider(FleetService)
      .useValue(fleetService)
      .overrideProvider(WashService)
      .useValue(washService)
      .overrideProvider(LavajatoService)
      .useValue(lavajatoService)
      .overrideProvider(RentalService)
      .useValue(rentalService)
      .overrideProvider(TemplatesService)
      .useValue(templatesService)
      .overrideProvider(DocumentsService)
      .useValue(documentsService)
      .overrideProvider(ReportsService)
      .useValue(reportsService)
      .overrideProvider(PaymentsService)
      .useValue(paymentsService)
      .overrideProvider(InventoryService)
      .useValue(inventoryService)
      .overrideProvider(StorageService)
      .useValue(storageService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('health happy path', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('ok');
      });
  });

  it('auth happy path (forgot password)', () => {
    return request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email: 'admin@rcar.com.br' })
      .expect(200);
  });

  it('users happy path', () => {
    return request(app.getHttpServer()).get('/users').expect(200);
  });

  it('customers happy path', () => {
    return request(app.getHttpServer()).get('/customers?page=1&perPage=20').expect(200);
  });

  it('fleet happy path', () => {
    return request(app.getHttpServer()).get('/fleet?page=1&perPage=20').expect(200);
  });

  it('wash happy path', () => {
    return request(app.getHttpServer()).get('/wash/services?page=1&perPage=20').expect(200);
  });

  it('lavajato happy path', () => {
    return request(app.getHttpServer()).get('/lavajato/schedules?date=2026-05-08').expect(200);
  });

  it('rental happy path', () => {
    return request(app.getHttpServer()).get('/rental/contracts?page=1&perPage=20').expect(200);
  });

  it('templates happy path', () => {
    return request(app.getHttpServer()).get('/templates').expect(200);
  });

  it('documents pdf happy path', () => {
    return request(app.getHttpServer())
      .post('/documents/templates/4f2209e2-124e-4f93-a36f-a0560f5f4d83/pdf')
      .send({ variables: { nomeCliente: 'Maria' } })
      .expect(201)
      .expect('content-type', /application\/pdf/);
  });

  it('reports happy path', () => {
    return request(app.getHttpServer()).get('/reports/dashboard').expect(200);
  });

  it('payments happy path', () => {
    return request(app.getHttpServer()).get('/payments?page=1&perPage=20').expect(200);
  });

  it('inventory happy path', () => {
    return request(app.getHttpServer()).get('/inventory/products?page=1&perPage=20').expect(200);
  });

  it('storage happy path', () => {
    return request(app.getHttpServer())
      .get('/storage/signed-url?objectKey=customers%2Ffile.jpg')
      .expect(200);
  });

  afterAll(async () => {
    await app.close();
  });
});
