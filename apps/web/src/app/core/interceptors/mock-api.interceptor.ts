import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';

// ─── Static reference data ───────────────────────────────────────────────────

const MOCK_WASH_SERVICES = [
  { id: 'ws1', nome: 'Lavagem Simples',   descricao: 'Lavagem externa completa',      preco: 35,  duracaoMin: 30,  ativo: true, createdAt: '2025-01-01T00:00:00Z' },
  { id: 'ws2', nome: 'Lavagem Completa',  descricao: 'Lavagem externa + interna',     preco: 65,  duracaoMin: 60,  ativo: true, createdAt: '2025-01-01T00:00:00Z' },
  { id: 'ws3', nome: 'Polimento',         descricao: 'Polimento + cristalização',     preco: 180, duracaoMin: 120, ativo: true, createdAt: '2025-01-01T00:00:00Z' },
  { id: 'ws4', nome: 'Higienização',      descricao: 'Higienização interna completa', preco: 120, duracaoMin: 90,  ativo: true, createdAt: '2025-01-01T00:00:00Z' },
];

const MOCK_CUSTOMERS = [
  { id: 'c1', tipo: 'PF' as const, nome: 'Carlos Andrade',      cpfCnpj: '123.456.789-00', email: 'carlos@mail.com',      telefone: '(11) 91234-5678', cnh: '12345678', cnhValidade: '2028-06-01', ativo: true, createdAt: '2025-01-10T10:00:00Z' },
  { id: 'c2', tipo: 'PF' as const, nome: 'Ana Beatriz Lima',    cpfCnpj: '987.654.321-00', email: 'ana@mail.com',          telefone: '(21) 99876-5432', cnh: '87654321', cnhValidade: '2027-09-15', ativo: true, createdAt: '2025-02-05T08:30:00Z' },
  { id: 'c3', tipo: 'PJ' as const, nome: 'Logística Rápida Ltda', cpfCnpj: '12.345.678/0001-90', email: 'contato@logistica.com', telefone: '(31) 3456-7890', razaoSocial: 'Logística Rápida Ltda', responsavel: 'Marcos Oliveira', ativo: true, createdAt: '2025-03-01T09:00:00Z' },
  { id: 'c4', tipo: 'PF' as const, nome: 'Fernanda Costa',      cpfCnpj: '321.654.987-11', email: 'fernanda@mail.com',    telefone: '(41) 98765-4321', cnh: '54321678', cnhValidade: '2029-03-20', ativo: true, createdAt: '2025-04-01T08:00:00Z' },
  { id: 'c5', tipo: 'PF' as const, nome: 'Rafael Mendes',       cpfCnpj: '456.789.012-33', email: 'rafael@mail.com',      telefone: '(51) 97654-3210', cnh: '98765432', cnhValidade: '2026-12-01', ativo: true, createdAt: '2025-04-15T07:00:00Z' },
];

const MOCK_VEHICLES = [
  { id: 'v1', placa: 'ABC-1234', modelo: 'Onix 1.0',     ano: 2023, cor: 'Branco', categoria: 'ECONOMICO'     as const, status: 'DISPONIVEL'  as const, fotos: [], kmAtual: 15240, createdAt: '2025-01-05T00:00:00Z' },
  { id: 'v2', placa: 'DEF-5678', modelo: 'Corolla 2.0',  ano: 2022, cor: 'Prata',  categoria: 'INTERMEDIARIO' as const, status: 'ALUGADO'     as const, fotos: [], kmAtual: 42800, createdAt: '2025-01-05T00:00:00Z' },
  { id: 'v3', placa: 'GHI-9012', modelo: 'HR-V EXL',     ano: 2024, cor: 'Preto', categoria: 'SUV'           as const, status: 'DISPONIVEL'  as const, fotos: [], kmAtual: 6200,  createdAt: '2025-02-10T00:00:00Z' },
  { id: 'v4', placa: 'JKL-3456', modelo: 'S10 High',     ano: 2021, cor: 'Azul',  categoria: 'UTILITARIO'   as const, status: 'MANUTENCAO'  as const, fotos: [], kmAtual: 88500, createdAt: '2025-01-05T00:00:00Z' },
  { id: 'v5', placa: 'MNO-7890', modelo: 'Renegade Sport', ano: 2023, cor: 'Vermelho', categoria: 'SUV'      as const, status: 'DISPONIVEL'  as const, fotos: [], kmAtual: 22100, createdAt: '2025-03-01T00:00:00Z' },
  { id: 'v6', placa: 'PQR-2345', modelo: 'Polo Track',   ano: 2024, cor: 'Cinza', categoria: 'ECONOMICO'     as const, status: 'DISPONIVEL'  as const, fotos: [], kmAtual: 4800,  createdAt: '2025-04-01T00:00:00Z' },
];

const MOCK_PRODUCTS = [
  { id: 'p1', nome: 'Shampoo Automotivo 5L',       unidade: 'un', quantidadeAtual: 8,  estoqueMinimo: 5,  custoUnitario: 42.5, ativo: true, createdAt: '2025-01-01T00:00:00Z' },
  { id: 'p2', nome: 'Cera Líquida 500ml',          unidade: 'un', quantidadeAtual: 3,  estoqueMinimo: 5,  custoUnitario: 28.9, ativo: true, createdAt: '2025-01-01T00:00:00Z' },
  { id: 'p3', nome: 'Microfibra 40x40',            unidade: 'un', quantidadeAtual: 20, estoqueMinimo: 10, custoUnitario: 8.0,  ativo: true, createdAt: '2025-01-01T00:00:00Z' },
  { id: 'p4', nome: 'Detergente Desengraxante 1L', unidade: 'un', quantidadeAtual: 4,  estoqueMinimo: 8,  custoUnitario: 15.0, ativo: true, createdAt: '2025-01-01T00:00:00Z' },
  { id: 'p5', nome: 'Silicone Spray 300ml',        unidade: 'un', quantidadeAtual: 12, estoqueMinimo: 6,  custoUnitario: 19.9, ativo: true, createdAt: '2025-01-01T00:00:00Z' },
];

// ─── Mutable users (shared between auth/me and list endpoints) ────────────────
const MOCK_ADMIN_USER    = { id: 'mock-user-1',    nome: 'Administrador',   email: 'admin@rcar.dev',    role: 'GESTOR_GERAL' as const, ativo: true, createdAt: '2025-01-01T00:00:00Z' };
const MOCK_OPERADOR_USER = { id: 'mock-user-2',    nome: 'Operador Silva',  email: 'operador@rcar.dev', role: 'OPERADOR'     as const, ativo: true, createdAt: '2025-02-01T00:00:00Z' };
const MOCK_CLIENT_USER   = { id: 'mock-client-1',  nome: 'Carlos Andrade',  email: 'cliente@rcar.dev',  role: 'CLIENTE'      as const, ativo: true, createdAt: '2025-01-10T00:00:00Z' };

/** Current logged-in user — mutated on POST /auth/login */
let mockCurrentUser: typeof MOCK_ADMIN_USER | typeof MOCK_OPERADOR_USER | typeof MOCK_CLIENT_USER = MOCK_ADMIN_USER;

/** Customer record linked to MOCK_CLIENT_USER */
const CLIENT_CUSTOMER_ID = 'c1';

const MOCK_USERS_LIST = [MOCK_ADMIN_USER, MOCK_OPERADOR_USER];

// ─── Date helpers ─────────────────────────────────────────────────────────────
const TODAY = new Date().toISOString().slice(0, 10);

function dt(date: string, hhmm: string) {
  return `${date}T${hhmm}:00.000Z`;
}

function yesterday(offset = 1) {
  const d = new Date(); d.setDate(d.getDate() - offset); return d.toISOString().slice(0, 10);
}

function tomorrow(offset = 1) {
  const d = new Date(); d.setDate(d.getDate() + offset); return d.toISOString().slice(0, 10);
}

// ─── Mutable state arrays — modified by POST/PATCH/DELETE handlers ─────────────

let mockSchedules: Record<string, unknown>[] = [
  { id: 's1', nomeAvulso: 'Maria Santos',    serviceId: 'ws1', dataHora: dt(TODAY, '08:30'), status: 'AGENDADO',       service: MOCK_WASH_SERVICES[0] },
  { id: 's2', customerId: 'c2',              serviceId: 'ws2', dataHora: dt(TODAY, '09:00'), status: 'EM_ATENDIMENTO', service: MOCK_WASH_SERVICES[1], customer: { id: 'c2', nome: 'Ana Beatriz Lima', telefone: '(21) 99876-5432' } },
  { id: 's3', customerId: 'c1',              serviceId: 'ws1', dataHora: dt(TODAY, '10:00'), status: 'AGENDADO',       service: MOCK_WASH_SERVICES[0], customer: { id: 'c1', nome: 'Carlos Andrade',    telefone: '(11) 91234-5678' } },
  { id: 's4', nomeAvulso: 'Pedro Alves',     serviceId: 'ws3', dataHora: dt(TODAY, '11:30'), status: 'AGENDADO',       service: MOCK_WASH_SERVICES[2] },
  { id: 's5', customerId: 'c4',              serviceId: 'ws4', dataHora: dt(TODAY, '14:00'), status: 'AGENDADO',       service: MOCK_WASH_SERVICES[3], customer: { id: 'c4', nome: 'Fernanda Costa',    telefone: '(41) 98765-4321' } },
  { id: 's6', customerId: 'c2',              serviceId: 'ws1', dataHora: dt(TODAY, '16:00'), status: 'CONCLUIDO',      service: MOCK_WASH_SERVICES[0], customer: { id: 'c2', nome: 'Ana Beatriz Lima', telefone: '(21) 99876-5432' } },
  // Yesterday
  { id: 's7', nomeAvulso: 'João da Silva',   serviceId: 'ws2', dataHora: dt(yesterday(), '09:00'), status: 'CONCLUIDO', service: MOCK_WASH_SERVICES[1] },
  { id: 's8', customerId: 'c1',              serviceId: 'ws1', dataHora: dt(yesterday(), '11:00'), status: 'CONCLUIDO', service: MOCK_WASH_SERVICES[0], customer: { id: 'c1', nome: 'Carlos Andrade', telefone: '(11) 91234-5678' } },
  // Tomorrow
  { id: 's9',  customerId: 'c5',             serviceId: 'ws2', dataHora: dt(tomorrow(), '09:30'), status: 'AGENDADO', service: MOCK_WASH_SERVICES[1], customer: { id: 'c5', nome: 'Rafael Mendes', telefone: '(51) 97654-3210' } },
  { id: 's10', customerId: 'c1',             serviceId: 'ws3', dataHora: dt(tomorrow(), '15:00'), status: 'AGENDADO', service: MOCK_WASH_SERVICES[2], customer: { id: 'c1', nome: 'Carlos Andrade', telefone: '(11) 91234-5678' } },
];

let mockQueue: Record<string, unknown>[] = [
  { id: 'q1', nomeAvulso: 'João da Silva',  serviceId: 'ws1', veiculoPlaca: 'XYZ-9999', status: 'AGUARDANDO',    posicao: 1, createdAt: new Date(Date.now() - 25 * 60000).toISOString(), service: MOCK_WASH_SERVICES[0] },
  { id: 'q2', customerId: 'c1',             serviceId: 'ws2', veiculoPlaca: 'ABC-1234', status: 'EM_ATENDIMENTO', posicao: 2, createdAt: new Date(Date.now() - 40 * 60000).toISOString(), service: MOCK_WASH_SERVICES[1], customer: { id: 'c1', nome: 'Carlos Andrade' } },
  { id: 'q3', customerId: 'c4',             serviceId: 'ws4', veiculoPlaca: 'MNO-7890', status: 'AGUARDANDO',    posicao: 3, createdAt: new Date(Date.now() - 10 * 60000).toISOString(), service: MOCK_WASH_SERVICES[3], customer: { id: 'c4', nome: 'Fernanda Costa' } },
  { id: 'q4', nomeAvulso: 'Marcos Lima',    serviceId: 'ws1', veiculoPlaca: 'PQR-0001', status: 'CONCLUIDO',     posicao: 1, createdAt: new Date(Date.now() - 90 * 60000).toISOString(), concluidoAt: new Date(Date.now() - 60 * 60000).toISOString(), service: MOCK_WASH_SERVICES[0] },
];

let mockContracts: Record<string, unknown>[] = [
  {
    id: 'rc1', customerId: 'c1', vehicleId: 'v2', modalidade: 'DIARIA' as const,
    dataRetirada: '2026-05-01T10:00:00Z', dataDevolucao: '2026-05-05T10:00:00Z',
    valorDiaria: 180, valorTotal: 720, seguro: true, valorSeguro: 72,
    status: 'ATIVO' as const, kmRetirada: 42000, kmLimite: 200, combustivelSaida: 'CHEIO',
    createdAt: '2026-05-01T09:00:00Z',
    customer: { id: 'c1', nome: 'Carlos Andrade', cpfCnpj: '123.456.789-00' },
    vehicle: { id: 'v2', placa: 'DEF-5678', modelo: 'Corolla 2.0', kmAtual: 42800 },
  },
  {
    id: 'rc2', customerId: 'c2', vehicleId: 'v1', modalidade: 'SEMANAL' as const,
    dataRetirada: '2026-04-20T10:00:00Z', dataDevolucao: '2026-04-27T10:00:00Z',
    dataDevReal: '2026-04-27T09:30:00Z',
    valorDiaria: 120, valorTotal: 840, seguro: false,
    status: 'ENCERRADO' as const, kmRetirada: 14800, kmLimite: 200, combustivelSaida: 'CHEIO',
    createdAt: '2026-04-20T09:00:00Z',
    customer: { id: 'c2', nome: 'Ana Beatriz Lima', cpfCnpj: '987.654.321-00' },
    vehicle: { id: 'v1', placa: 'ABC-1234', modelo: 'Onix 1.0', kmAtual: 15240 },
  },
  {
    id: 'rc3', customerId: 'c1', vehicleId: 'v3', modalidade: 'DIARIA' as const,
    dataRetirada: tomorrow(), dataDevolucao: tomorrow(4),
    valorDiaria: 220, valorTotal: 660, seguro: true, valorSeguro: 66,
    status: 'RESERVADO' as const,
    createdAt: new Date().toISOString(),
    customer: { id: 'c1', nome: 'Carlos Andrade', cpfCnpj: '123.456.789-00' },
    vehicle: { id: 'v3', placa: 'GHI-9012', modelo: 'HR-V EXL', kmAtual: 6200 },
  },
];

const MOCK_TEMPLATES = [
  { id: 't1', nome: 'Contrato Padrão',  tipo: 'CONTRATO_LOCACAO' as const, conteudoHtml: '<h2>Contrato de Locação</h2><p>Locatário: {{nomeCliente}}</p><p>Veículo: {{veiculo}}</p><p>Retirada: {{dataRetirada}}</p>', variaveis: ['nomeCliente', 'veiculo', 'dataRetirada'], ativo: true, createdAt: '2025-01-01T00:00:00Z' },
  { id: 't2', nome: 'Recibo Lavagem',   tipo: 'RECIBO_LAVAGEM'   as const, conteudoHtml: '<h2>Recibo de Lavagem</h2><p>Cliente: {{nomeCliente}}</p><p>Serviço: {{servico}}</p><p>Valor: {{valor}}</p>',          variaveis: ['nomeCliente', 'servico', 'valor'],   ativo: true, createdAt: '2025-01-01T00:00:00Z' },
];

const MOCK_STOCK_MOVEMENTS = [
  { id: 'sm1', productId: 'p1', tipo: 'ENTRADA' as const, quantidade: 10, motivo: 'Compra fornecedor', createdAt: '2026-05-01T08:00:00Z', product: { nome: 'Shampoo Automotivo 5L',       unidade: 'un' } },
  { id: 'sm2', productId: 'p2', tipo: 'SAIDA'   as const, quantidade: 2,  motivo: 'Uso em serviços',   createdAt: '2026-05-02T09:30:00Z', product: { nome: 'Cera Líquida 500ml',          unidade: 'un' } },
  { id: 'sm3', productId: 'p4', tipo: 'SAIDA'   as const, quantidade: 4,  motivo: 'Uso em serviços',   createdAt: '2026-05-03T11:00:00Z', product: { nome: 'Detergente Desengraxante 1L', unidade: 'un' } },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function qs(url: string): URLSearchParams {
  return new URLSearchParams(url.includes('?') ? url.split('?')[1] : '');
}

function paginated<T>(data: T[], page = 1, perPage = 20) {
  const start = (page - 1) * perPage;
  return { data: data.slice(start, start + perPage), total: data.length, page, perPage, totalPages: Math.ceil(data.length / perPage) };
}

function ok<T>(body: T) {
  return of(new HttpResponse({ status: 200, body }));
}

// ─── Interceptor ─────────────────────────────────────────────────────────────

export const mockApiInterceptor: HttpInterceptorFn = (req, next) => {
  const url    = req.url.replace(/^https?:\/\/[^/]+(\/api)?/, '');
  const method = req.method.toUpperCase();
  const params = qs(url);
  const path   = url.split('?')[0];

  // ── Auth ──────────────────────────────────────────────────────────────────
  if (method === 'POST' && path === '/auth/login') {
    const { email } = (req.body ?? {}) as { email?: string };
    if      (email === 'operador@rcar.dev') mockCurrentUser = MOCK_OPERADOR_USER;
    else if (email === 'cliente@rcar.dev')  mockCurrentUser = MOCK_CLIENT_USER;
    else                                    mockCurrentUser = MOCK_ADMIN_USER;
    return ok({ accessToken: 'mock-access-token', refreshToken: 'mock-refresh-token', user: mockCurrentUser });
  }
  if (method === 'GET'  && path === '/auth/me')      return ok(mockCurrentUser);
  if (method === 'POST' && (path === '/auth/logout' || path === '/auth/refresh')) {
    return ok({ accessToken: 'mock-access-token', refreshToken: 'mock-refresh-token' });
  }
  if (method === 'POST' && path === '/auth/forgot-password') return ok({ message: 'E-mail enviado (mock).' });
  if (method === 'POST' && path === '/auth/reset-password')  return ok({ message: 'Senha redefinida (mock).' });

  // ── Reports ───────────────────────────────────────────────────────────────
  if (method === 'GET' && path === '/reports/dashboard') {
    return ok({ usersCount: MOCK_USERS_LIST.length, vehiclesCount: MOCK_VEHICLES.length, customersCount: MOCK_CUSTOMERS.length, servicesCount: MOCK_WASH_SERVICES.length, lowStock: MOCK_PRODUCTS.filter(p => p.quantidadeAtual < p.estoqueMinimo) });
  }
  if (method === 'GET' && path === '/reports/charts') {
    return ok({
      weeklyServices: { labels: ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'], data: [5,8,6,12,9,15,4] },
      rushHour:       { labels: ['08h','09h','10h','11h','12h','13h','14h','15h','16h','17h','18h'], data: [2,5,8,6,3,4,9,11,7,5,2] },
      incomeOutcome:  { labels: ['Jan','Fev','Mar','Abr','Mai'], income: [3200,4100,3800,5200,4700], outcome: [8,12,9,15,11] },
      productUsage:   { labels: MOCK_PRODUCTS.map(p => p.nome), data: [18,12,30,8,6] },
    });
  }
  if (method === 'GET' && path === '/reports/daily')   return ok({ lavajato: { agendados: 7, concluidos: 5, cancelados: 1, walkins: 3, receita: 485 }, aluguel: { novasReservas: 2, receita: 720 } });
  if (method === 'GET' && path === '/reports/monthly') return ok({ receita: { lavajato: 8400, aluguel: 14200, total: 22600 }, novosClientes: 8, novosContratos: 12 });

  // ── Users ─────────────────────────────────────────────────────────────────
  if (method === 'GET'    && path === '/users') return ok(MOCK_USERS_LIST);
  if (method === 'POST'   && path === '/users') {
    const u = { ...(req.body as object), id: `user-${Date.now()}`, ativo: true, createdAt: new Date().toISOString() };
    MOCK_USERS_LIST.push(u as never);
    return ok(u);
  }
  if (method === 'PUT'    && path.match(/\/users\/.+/)) return ok({ ...MOCK_USERS_LIST[0], ...(req.body as object) });
  if (method === 'DELETE' && path.match(/\/users\/.+/)) return ok({});

  // ── Customers ─────────────────────────────────────────────────────────────
  if (method === 'GET' && path.match(/\/customers\/[^/]+\/history/)) {
    const id = path.split('/customers/')[1].replace('/history', '');
    const c  = MOCK_CUSTOMERS.find(x => x.id === id) ?? MOCK_CUSTOMERS[0];
    return ok({ customer: c, schedules: mockSchedules.filter(s => s['customerId'] === id), contracts: mockContracts.filter(c2 => c2['customerId'] === id) });
  }
  if (method === 'GET' && path.match(/\/customers\/[^/]+$/)) {
    const id = path.split('/customers/')[1];
    return ok(MOCK_CUSTOMERS.find(x => x.id === id) ?? MOCK_CUSTOMERS[0]);
  }
  if (method === 'GET'    && path.startsWith('/customers')) return ok(paginated(MOCK_CUSTOMERS));
  if (method === 'POST'   && path.startsWith('/customers')) return ok({ ...(req.body as object), id: `cust-${Date.now()}`, ativo: true, createdAt: new Date().toISOString() });
  if (method === 'PUT'    && path.match(/\/customers\/.+/)) return ok({ ...MOCK_CUSTOMERS[0], ...(req.body as object) });
  if (method === 'DELETE' && path.match(/\/customers\/.+/)) return ok({});

  // ── Fleet ─────────────────────────────────────────────────────────────────
  if (method === 'GET' && path.match(/\/fleet\/[^/]+$/)) {
    const id = path.split('/fleet/')[1];
    return ok({ ...(MOCK_VEHICLES.find(x => x.id === id) ?? MOCK_VEHICLES[0]), maintenances: [], contracts: mockContracts.filter(c => c['vehicleId'] === id) });
  }
  if (method === 'GET'    && path.startsWith('/fleet')) return ok(paginated(MOCK_VEHICLES, Number(params.get('page') ?? 1)));
  if (method === 'POST'   && path.startsWith('/fleet')) return ok({ ...(req.body as object), id: `v-${Date.now()}`, fotos: [], createdAt: new Date().toISOString() });
  if (method === 'PATCH'  && path.match(/\/fleet\/.+/)) return ok({ ...MOCK_VEHICLES[0], ...(req.body as object) });
  if (method === 'PUT'    && path.match(/\/fleet\/.+/)) return ok({ ...MOCK_VEHICLES[0], ...(req.body as object) });
  if (method === 'DELETE' && path.match(/\/fleet\/.+/)) return ok({});

  // ── Inventory ─────────────────────────────────────────────────────────────
  if (method === 'GET' && path.startsWith('/inventory/products')) {
    const idMatch = path.match(/\/inventory\/products\/([^?]+)/);
    if (idMatch) return ok(MOCK_PRODUCTS.find(p => p.id === idMatch[1]) ?? MOCK_PRODUCTS[0]);
    return ok(paginated(MOCK_PRODUCTS));
  }
  if (method === 'POST'   && path.startsWith('/inventory/products')) return ok({ ...(req.body as object), id: `prod-${Date.now()}`, ativo: true, createdAt: new Date().toISOString() });
  if (method === 'PUT'    && path.match(/\/inventory\/products\/.+/)) return ok({ ...MOCK_PRODUCTS[0], ...(req.body as object) });
  if (method === 'DELETE' && path.match(/\/inventory\/products\/.+/)) return ok({});
  if (method === 'GET'    && path.startsWith('/inventory/movements')) return ok(paginated(MOCK_STOCK_MOVEMENTS));
  if (method === 'POST'   && path.startsWith('/inventory/movements')) {
    const body = req.body as Record<string, unknown>;
    const product = MOCK_PRODUCTS.find(p => p.id === body['productId']);
    return ok({ ...body, id: `sm-${Date.now()}`, createdAt: new Date().toISOString(), product: product ? { nome: product.nome, unidade: product.unidade } : undefined });
  }

  // ── Wash services ─────────────────────────────────────────────────────────
  if (method === 'GET'    && path.startsWith('/wash/services')) return ok(paginated(MOCK_WASH_SERVICES));
  if (method === 'POST'   && path.startsWith('/wash/services')) return ok({ ...(req.body as object), id: `ws-${Date.now()}`, ativo: true, createdAt: new Date().toISOString() });
  if (method === 'PATCH'  && path.match(/\/wash\/services\/.+/)) return ok({ ...MOCK_WASH_SERVICES[0], ...(req.body as object) });
  if (method === 'PUT'    && path.match(/\/wash\/services\/.+/)) return ok({ ...MOCK_WASH_SERVICES[0], ...(req.body as object) });
  if (method === 'DELETE' && path.match(/\/wash\/services\/.+/)) return ok({});

  // ── Lavajato queue ────────────────────────────────────────────────────────
  if (method === 'GET' && path.startsWith('/lavajato/queue') && !path.includes('/advance') && !path.includes('/payment') && !path.includes('/stream')) {
    return ok(mockQueue);
  }
  if (method === 'POST' && path.match(/\/lavajato\/queue\/[^/]+\/payment/)) return ok({ message: 'Pagamento registrado (mock).' });

  if (method === 'PATCH' && path.match(/\/lavajato\/queue\/[^/]+\/advance/)) {
    const id = path.split('/lavajato/queue/')[1].replace('/advance', '');
    const ORDER = ['AGUARDANDO', 'EM_ATENDIMENTO', 'CONCLUIDO'];
    const item = mockQueue.find(q => q['id'] === id);
    if (item) {
      const idx = ORDER.indexOf(item['status'] as string);
      if (idx < ORDER.length - 1) {
        item['status'] = ORDER[idx + 1];
        if (item['status'] === 'CONCLUIDO') item['concluidoAt'] = new Date().toISOString();
      }
    }
    return ok(item ?? {});
  }
  if (method === 'POST' && path.startsWith('/lavajato/queue')) {
    const body = req.body as Record<string, unknown>;
    const svc  = MOCK_WASH_SERVICES.find(s => s.id === body['serviceId']);
    const pos  = mockQueue.filter(q => q['status'] === 'AGUARDANDO').length + 1;
    const entry = { ...body, id: `q-${Date.now()}`, status: 'AGUARDANDO', posicao: pos, createdAt: new Date().toISOString(), service: svc };
    mockQueue.push(entry);
    return ok(entry);
  }

  // ── Lavajato schedules ───────────────────────────────────────────────────
  if (method === 'GET' && path.startsWith('/lavajato/schedules') && !path.match(/\/schedules\/.+/)) {
    const date = params.get('date');
    const result = date ? mockSchedules.filter(s => (s['dataHora'] as string).startsWith(date)) : mockSchedules;
    return ok(result);
  }
  if (method === 'POST' && path.match(/\/lavajato\/schedules\/[^/]+\/payment/)) return ok({ message: 'Pagamento registrado (mock).' });
  if (method === 'PATCH' && path.match(/\/lavajato\/schedules\/[^/]+\/status/)) {
    const id     = path.split('/lavajato/schedules/')[1].replace('/status', '');
    const body   = req.body as Record<string, unknown>;
    const item   = mockSchedules.find(s => s['id'] === id);
    if (item) item['status'] = body['status'];
    return ok(item ?? {});
  }
  if (method === 'DELETE' && path.match(/\/lavajato\/schedules\/[^/]+/)) {
    const id   = path.split('/lavajato/schedules/')[1];
    const item = mockSchedules.find(s => s['id'] === id);
    if (item) item['status'] = 'CANCELADO';
    return ok(item ?? {});
  }
  if (method === 'POST' && path.startsWith('/lavajato/schedules')) {
    const body   = req.body as Record<string, unknown>;
    const svc    = MOCK_WASH_SERVICES.find(s => s.id === body['serviceId']);
    const entry  = { ...body, id: `sch-${Date.now()}`, status: 'AGENDADO', service: svc };
    mockSchedules.push(entry);
    return ok(entry);
  }

  // ── Lavajato atendimentos ────────────────────────────────────────────────
  if (method === 'GET' && path.startsWith('/lavajato/atendimentos')) {
    return ok({ schedules: mockSchedules, queues: mockQueue });
  }

  // ── Portal cliente (authenticated client endpoints) ───────────────────────
  if (method === 'GET'  && path === '/portal/my-schedules') {
    return ok(mockSchedules.filter(s => s['customerId'] === CLIENT_CUSTOMER_ID));
  }
  if (method === 'POST' && path === '/portal/my-schedules') {
    const body  = req.body as Record<string, unknown>;
    const svc   = MOCK_WASH_SERVICES.find(s => s.id === body['serviceId']);
    const entry = { ...body, id: `sch-${Date.now()}`, customerId: CLIENT_CUSTOMER_ID, status: 'AGENDADO', service: svc, customer: { id: 'c1', nome: 'Carlos Andrade', telefone: '(11) 91234-5678' } };
    mockSchedules.push(entry);
    return ok(entry);
  }
  if (method === 'GET'  && path === '/portal/my-contracts') {
    return ok(paginated(mockContracts.filter(c => c['customerId'] === CLIENT_CUSTOMER_ID)));
  }
  if (method === 'GET'  && path === '/portal/available-vehicles') {
    return ok(paginated(MOCK_VEHICLES.filter(v => v.status === 'DISPONIVEL')));
  }

  // ── Rental contracts ─────────────────────────────────────────────────────
  if (method === 'GET' && path.match(/\/rental\/contracts\/[^/]+$/)) {
    const id = path.split('/rental/contracts/')[1];
    return ok(mockContracts.find(c => c['id'] === id) ?? { ...mockContracts[0], inspections: [], payments: [] });
  }
  if (method === 'PATCH' && path.match(/\/rental\/contracts\/[^/]+\/close/))   { const id = path.split('/')[3]; const c = mockContracts.find(x => x['id'] === id); if (c) c['status'] = 'ENCERRADO';  return ok(c ?? {}); }
  if (method === 'PATCH' && path.match(/\/rental\/contracts\/[^/]+\/open/))    { const id = path.split('/')[3]; const c = mockContracts.find(x => x['id'] === id); if (c) c['status'] = 'ATIVO';      return ok(c ?? {}); }
  if (method === 'PATCH' && path.match(/\/rental\/contracts\/[^/]+\/cancel/))  { const id = path.split('/')[3]; const c = mockContracts.find(x => x['id'] === id); if (c) c['status'] = 'CANCELADO'; return ok(c ?? {}); }
  if (method === 'GET'   && path.startsWith('/rental/contracts')) return ok(paginated(mockContracts));
  if (method === 'POST'  && path.match(/\/rental\/contracts\/[^/]+\/payment/)) return ok({ message: 'Pagamento registrado (mock).' });
  if (method === 'POST'  && path.startsWith('/rental/contracts')) {
    const body  = req.body as Record<string, unknown>;
    const entry = { ...body, id: `rc-${Date.now()}`, status: 'RESERVADO', createdAt: new Date().toISOString() };
    mockContracts.push(entry);
    return ok(entry);
  }
  if (method === 'PUT' && path.match(/\/rental\/contracts\/.+/)) return ok({ ...mockContracts[0], ...(req.body as object) });

  // ── Rental availability ──────────────────────────────────────────────────
  if (method === 'GET' && path.startsWith('/rental/available')) return ok(MOCK_VEHICLES.filter(v => v.status === 'DISPONIVEL'));

  // ── Templates ─────────────────────────────────────────────────────────────
  if (method === 'GET'    && path.startsWith('/templates')) return ok(MOCK_TEMPLATES);
  if (method === 'POST'   && path.startsWith('/templates')) return ok({ ...(req.body as object), id: `tmpl-${Date.now()}`, ativo: true, createdAt: new Date().toISOString() });
  if (method === 'PUT'    && path.match(/\/templates\/.+/)) return ok({ ...MOCK_TEMPLATES[0], ...(req.body as object) });
  if (method === 'DELETE' && path.match(/\/templates\/.+/)) return ok({});

  // ── Health ────────────────────────────────────────────────────────────────
  if (method === 'GET' && path.startsWith('/health')) return ok({ status: 'ok' });

  return next(req);
};

