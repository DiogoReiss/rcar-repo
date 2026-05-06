import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';

// ─── Seed data ───────────────────────────────────────────────────────────────

const MOCK_USER = {
  id: 'mock-user-1',
  nome: 'Administrador Mock',
  email: 'admin@rcar.dev',
  role: 'GESTOR_GERAL' as const,
  ativo: true,
  createdAt: '2025-01-01T00:00:00.000Z',
};

const MOCK_CUSTOMERS = [
  { id: 'c1', tipo: 'PF' as const, nome: 'Carlos Andrade', cpfCnpj: '123.456.789-00', email: 'carlos@mail.com', telefone: '(11) 91234-5678', cnh: '12345678', cnhValidade: '2028-06-01', ativo: true, createdAt: '2025-01-10T10:00:00Z' },
  { id: 'c2', tipo: 'PF' as const, nome: 'Ana Beatriz Lima', cpfCnpj: '987.654.321-00', email: 'ana@mail.com', telefone: '(21) 99876-5432', cnh: '87654321', cnhValidade: '2027-09-15', ativo: true, createdAt: '2025-02-05T08:30:00Z' },
  { id: 'c3', tipo: 'PJ' as const, nome: 'Logística Rápida Ltda', cpfCnpj: '12.345.678/0001-90', email: 'contato@logistica.com', telefone: '(31) 3456-7890', razaoSocial: 'Logística Rápida Ltda', responsavel: 'Marcos Oliveira', ativo: true, createdAt: '2025-03-01T09:00:00Z' },
];

const MOCK_VEHICLES = [
  { id: 'v1', placa: 'ABC-1234', modelo: 'Onix 1.0', ano: 2023, cor: 'Branco', categoria: 'ECONOMICO' as const, status: 'DISPONIVEL' as const, fotos: [], kmAtual: 15240, createdAt: '2025-01-05T00:00:00Z' },
  { id: 'v2', placa: 'DEF-5678', modelo: 'Corolla 2.0', ano: 2022, cor: 'Prata', categoria: 'INTERMEDIARIO' as const, status: 'ALUGADO' as const, fotos: [], kmAtual: 42800, createdAt: '2025-01-05T00:00:00Z' },
  { id: 'v3', placa: 'GHI-9012', modelo: 'HR-V EXL', ano: 2024, cor: 'Preto', categoria: 'SUV' as const, status: 'DISPONIVEL' as const, fotos: [], kmAtual: 6200, createdAt: '2025-02-10T00:00:00Z' },
  { id: 'v4', placa: 'JKL-3456', modelo: 'S10 High', ano: 2021, cor: 'Azul', categoria: 'UTILITARIO' as const, status: 'MANUTENCAO' as const, fotos: [], kmAtual: 88500, createdAt: '2025-01-05T00:00:00Z' },
];

const MOCK_WASH_SERVICES = [
  { id: 'ws1', nome: 'Lavagem Simples', descricao: 'Lavagem externa completa', preco: 35, duracaoMin: 30, ativo: true, createdAt: '2025-01-01T00:00:00Z' },
  { id: 'ws2', nome: 'Lavagem Completa', descricao: 'Lavagem externa + interna', preco: 65, duracaoMin: 60, ativo: true, createdAt: '2025-01-01T00:00:00Z' },
  { id: 'ws3', nome: 'Polimento', descricao: 'Polimento + cristalização', preco: 180, duracaoMin: 120, ativo: true, createdAt: '2025-01-01T00:00:00Z' },
];

const MOCK_PRODUCTS = [
  { id: 'p1', nome: 'Shampoo Automotivo 5L', unidade: 'un', quantidadeAtual: 8, estoqueMinimo: 5, custoUnitario: 42.5, ativo: true, createdAt: '2025-01-01T00:00:00Z' },
  { id: 'p2', nome: 'Cera Líquida 500ml', unidade: 'un', quantidadeAtual: 3, estoqueMinimo: 5, custoUnitario: 28.9, ativo: true, createdAt: '2025-01-01T00:00:00Z' },
  { id: 'p3', nome: 'Microfibra 40x40', unidade: 'un', quantidadeAtual: 20, estoqueMinimo: 10, custoUnitario: 8.0, ativo: true, createdAt: '2025-01-01T00:00:00Z' },
  { id: 'p4', nome: 'Detergente Desengraxante 1L', unidade: 'un', quantidadeAtual: 4, estoqueMinimo: 8, custoUnitario: 15.0, ativo: true, createdAt: '2025-01-01T00:00:00Z' },
];

const MOCK_USERS = [
  MOCK_USER,
  { id: 'mock-user-2', nome: 'Operador Silva', email: 'operador@rcar.dev', role: 'OPERADOR' as const, ativo: true, createdAt: '2025-02-01T00:00:00Z' },
];

const MOCK_TEMPLATES = [
  { id: 't1', nome: 'Contrato Padrão', tipo: 'CONTRATO_LOCACAO' as const, conteudoHtml: '<p>Contrato de Locação</p>', variaveis: ['nomeCliente', 'veiculo', 'dataRetirada'], ativo: true, createdAt: '2025-01-01T00:00:00Z' },
  { id: 't2', nome: 'Recibo Lavagem', tipo: 'RECIBO_LAVAGEM' as const, conteudoHtml: '<p>Recibo de Lavagem</p>', variaveis: ['nomeCliente', 'servico', 'valor'], ativo: true, createdAt: '2025-01-01T00:00:00Z' },
];

const MOCK_QUEUE: Record<string, unknown>[] = [
  { id: 'q1', nomeAvulso: 'João da Silva', serviceId: 'ws1', veiculoPlaca: 'XYZ-9999', status: 'AGUARDANDO', posicao: 1, createdAt: new Date().toISOString(), service: MOCK_WASH_SERVICES[0] },
  { id: 'q2', customerId: 'c1', serviceId: 'ws2', veiculoPlaca: 'ABC-1234', status: 'EM_ATENDIMENTO', posicao: 2, createdAt: new Date().toISOString(), service: MOCK_WASH_SERVICES[1], customer: { id: 'c1', nome: 'Carlos Andrade' } },
];

const MOCK_SCHEDULES: Record<string, unknown>[] = [
  { id: 's1', nomeAvulso: 'Maria Santos', serviceId: 'ws1', dataHora: new Date(Date.now() + 3600000).toISOString(), status: 'AGENDADO', service: MOCK_WASH_SERVICES[0] },
  { id: 's2', customerId: 'c2', serviceId: 'ws2', dataHora: new Date(Date.now() + 7200000).toISOString(), status: 'AGENDADO', service: MOCK_WASH_SERVICES[1], customer: { id: 'c2', nome: 'Ana Beatriz Lima', telefone: '(21) 99876-5432' } },
];

const MOCK_CONTRACTS = [
  {
    id: 'rc1', customerId: 'c1', vehicleId: 'v2', modalidade: 'DIARIA' as const,
    dataRetirada: '2026-05-01T10:00:00Z', dataDevolucao: '2026-05-05T10:00:00Z',
    valorDiaria: 180, valorTotal: 720, seguro: true, valorSeguro: 72,
    status: 'ATIVO' as const, kmRetirada: 42000, kmLimite: 200, combustivelSaida: 'CHEIO',
    createdAt: '2026-05-01T09:00:00Z',
    customer: { id: 'c1', nome: 'Carlos Andrade', cpfCnpj: '123.456.789-00' },
    vehicle: { id: 'v2', placa: 'DEF-5678', modelo: 'Corolla 2.0', kmAtual: 42800 },
  },
];

const MOCK_STOCK_MOVEMENTS = [
  { id: 'sm1', productId: 'p1', tipo: 'ENTRADA' as const, quantidade: 10, motivo: 'Compra fornecedor', createdAt: '2026-05-01T08:00:00Z', product: { nome: 'Shampoo Automotivo 5L', unidade: 'un' } },
  { id: 'sm2', productId: 'p2', tipo: 'SAIDA' as const, quantidade: 2, motivo: 'Uso em serviços', createdAt: '2026-05-02T09:30:00Z', product: { nome: 'Cera Líquida 500ml', unidade: 'un' } },
  { id: 'sm3', productId: 'p4', tipo: 'SAIDA' as const, quantidade: 4, motivo: 'Uso em serviços', createdAt: '2026-05-03T11:00:00Z', product: { nome: 'Detergente Desengraxante 1L', unidade: 'un' } },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function paginated<T>(data: T[], page = 1, perPage = 10) {
  const start = (page - 1) * perPage;
  const slice = data.slice(start, start + perPage);
  return { data: slice, total: data.length, page, perPage, totalPages: Math.ceil(data.length / perPage) };
}

function ok<T>(body: T) {
  return of(new HttpResponse({ status: 200, body }));
}

// ─── Interceptor ─────────────────────────────────────────────────────────────

/**
 * Intercepts all API calls and returns realistic mock data.
 * Registered only when `environment.mock === true` (via `--configuration mock`).
 */
export const mockApiInterceptor: HttpInterceptorFn = (req, next) => {
  const url = req.url.replace(/^https?:\/\/[^/]+(\/api)?/, '');
  const method = req.method.toUpperCase();

  // ── Auth ──────────────────────────────────────────────────────────────────
  if (method === 'POST' && url.startsWith('/auth/login')) {
    return ok({ accessToken: 'mock-access-token', refreshToken: 'mock-refresh-token', user: MOCK_USER });
  }
  if (method === 'GET' && url.startsWith('/auth/me')) {
    return ok(MOCK_USER);
  }
  if (method === 'POST' && (url.startsWith('/auth/logout') || url.startsWith('/auth/refresh'))) {
    return ok({ accessToken: 'mock-access-token', refreshToken: 'mock-refresh-token' });
  }
  if (method === 'POST' && url.startsWith('/auth/forgot-password')) {
    return ok({ message: 'E-mail de recuperação enviado (mock).' });
  }
  if (method === 'POST' && url.startsWith('/auth/reset-password')) {
    return ok({ message: 'Senha redefinida com sucesso (mock).' });
  }

  // ── Reports ───────────────────────────────────────────────────────────────
  if (method === 'GET' && url.startsWith('/reports/dashboard')) {
    return ok({
      usersCount: 2,
      vehiclesCount: 4,
      customersCount: 3,
      servicesCount: 3,
      lowStock: MOCK_PRODUCTS.filter(p => p.quantidadeAtual < p.estoqueMinimo),
    });
  }
  if (method === 'GET' && url.startsWith('/reports/charts')) {
    return ok({
      weeklyServices: {
        labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
        data: [5, 8, 6, 12, 9, 15, 4],
      },
      rushHour: {
        labels: ['08h', '09h', '10h', '11h', '12h', '13h', '14h', '15h', '16h', '17h', '18h'],
        data: [2, 5, 8, 6, 3, 4, 9, 11, 7, 5, 2],
      },
      incomeOutcome: {
        labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai'],
        income: [3200, 4100, 3800, 5200, 4700],
        outcome: [8, 12, 9, 15, 11],
      },
      productUsage: {
        labels: MOCK_PRODUCTS.map(p => p.nome),
        data: [18, 12, 30, 8],
      },
    });
  }
  if (method === 'GET' && url.startsWith('/reports/daily')) {
    return ok({
      lavajato: { agendados: 7, concluidos: 5, cancelados: 1, walkins: 3, receita: 485 },
      aluguel:  { novasReservas: 2, receita: 720 },
    });
  }
  if (method === 'GET' && url.startsWith('/reports/monthly')) {
    return ok({
      receita: { lavajato: 8400, aluguel: 14200, total: 22600 },
      novosClientes: 8,
      novosContratos: 12,
    });
  }

  // ── Users ─────────────────────────────────────────────────────────────────
  if (method === 'GET' && url.startsWith('/users')) {
    return ok(MOCK_USERS);
  }
  if (method === 'POST' && url.startsWith('/users')) {
    const body = req.body as Record<string, unknown>;
    return ok({ ...body, id: `user-${Date.now()}`, ativo: true, createdAt: new Date().toISOString() });
  }
  if (method === 'PUT' && url.match(/\/users\/.+/)) {
    const body = req.body as Record<string, unknown>;
    return ok({ ...MOCK_USERS[0], ...body });
  }
  if (method === 'DELETE' && url.match(/\/users\/.+/)) {
    return ok({});
  }

  // ── Customers ─────────────────────────────────────────────────────────────
  if (method === 'GET' && url.match(/\/customers\/[^?/]+\/history/)) {
    const c = MOCK_CUSTOMERS[0];
    return ok({ customer: c, schedules: [], contracts: [] });
  }
  if (method === 'GET' && url.match(/\/customers\/[^?/]+$/)) {
    const id = url.split('/customers/')[1];
    return ok(MOCK_CUSTOMERS.find(x => x.id === id) ?? MOCK_CUSTOMERS[0]);
  }
  if (method === 'GET' && url.startsWith('/customers')) {
    return ok(paginated(MOCK_CUSTOMERS));
  }
  if (method === 'POST' && url.startsWith('/customers')) {
    const body = req.body as Record<string, unknown>;
    return ok({ ...body, id: `cust-${Date.now()}`, ativo: true, createdAt: new Date().toISOString() });
  }
  if (method === 'PUT' && url.match(/\/customers\/.+/)) {
    const body = req.body as Record<string, unknown>;
    return ok({ ...MOCK_CUSTOMERS[0], ...body });
  }
  if (method === 'DELETE' && url.match(/\/customers\/.+/)) {
    return ok({});
  }

  // ── Fleet ─────────────────────────────────────────────────────────────────
  if (method === 'GET' && url.match(/\/fleet\/[^?/]+$/)) {
    const id = url.split('/fleet/')[1];
    const v = MOCK_VEHICLES.find(x => x.id === id) ?? MOCK_VEHICLES[0];
    return ok({ ...v, maintenances: [], contracts: [] });
  }
  if (method === 'GET' && url.startsWith('/fleet')) {
    return ok(paginated(MOCK_VEHICLES));
  }
  if (method === 'POST' && url.startsWith('/fleet')) {
    const body = req.body as Record<string, unknown>;
    return ok({ ...body, id: `v-${Date.now()}`, fotos: [], createdAt: new Date().toISOString() });
  }
  if (method === 'PATCH' && url.match(/\/fleet\/.+/)) {
    const body = req.body as Record<string, unknown>;
    return ok({ ...MOCK_VEHICLES[0], ...body });
  }
  if (method === 'PUT' && url.match(/\/fleet\/.+/)) {
    const body = req.body as Record<string, unknown>;
    return ok({ ...MOCK_VEHICLES[0], ...body });
  }
  if (method === 'DELETE' && url.match(/\/fleet\/.+/)) {
    return ok({});
  }

  // ── Inventory ─────────────────────────────────────────────────────────────
  if (method === 'GET' && url.startsWith('/inventory/products')) {
    const idMatch = url.match(/\/inventory\/products\/([^?]+)/);
    if (idMatch) {
      const product = MOCK_PRODUCTS.find(p => p.id === idMatch[1]) ?? MOCK_PRODUCTS[0];
      return ok(product);
    }
    return ok(paginated(MOCK_PRODUCTS));
  }
  if (method === 'POST' && url.startsWith('/inventory/products')) {
    const body = req.body as Record<string, unknown>;
    return ok({ ...body, id: `prod-${Date.now()}`, ativo: true, createdAt: new Date().toISOString() });
  }
  if (method === 'PUT' && url.match(/\/inventory\/products\/.+/)) {
    const body = req.body as Record<string, unknown>;
    return ok({ ...MOCK_PRODUCTS[0], ...body });
  }
  if (method === 'DELETE' && url.match(/\/inventory\/products\/.+/)) {
    return ok({});
  }
  if (method === 'GET' && url.startsWith('/inventory/movements')) {
    return ok(paginated(MOCK_STOCK_MOVEMENTS));
  }
  if (method === 'POST' && url.startsWith('/inventory/movements')) {
    const body = req.body as Record<string, unknown>;
    const product = MOCK_PRODUCTS.find(p => p.id === body['productId']);
    return ok({ ...body, id: `sm-${Date.now()}`, createdAt: new Date().toISOString(), product: product ? { nome: product.nome, unidade: product.unidade } : undefined });
  }

  // ── Wash services ─────────────────────────────────────────────────────────
  if (method === 'GET' && url.startsWith('/wash/services')) {
    return ok(paginated(MOCK_WASH_SERVICES));
  }
  if (method === 'POST' && url.startsWith('/wash/services')) {
    const body = req.body as Record<string, unknown>;
    return ok({ ...body, id: `ws-${Date.now()}`, ativo: true, createdAt: new Date().toISOString() });
  }
  if (method === 'PATCH' && url.match(/\/wash\/services\/.+/)) {
    const body = req.body as Record<string, unknown>;
    return ok({ ...MOCK_WASH_SERVICES[0], ...body });
  }
  if (method === 'PUT' && url.match(/\/wash\/services\/.+/)) {
    const body = req.body as Record<string, unknown>;
    return ok({ ...MOCK_WASH_SERVICES[0], ...body });
  }
  if (method === 'DELETE' && url.match(/\/wash\/services\/.+/)) {
    return ok({});
  }

  // ── Lavajato queue ────────────────────────────────────────────────────────
  if (method === 'GET' && url.startsWith('/lavajato/queue')) {
    return ok(MOCK_QUEUE);
  }
  if (method === 'POST' && url.match(/\/lavajato\/queue\/[^/]+\/payment/)) {
    return ok({ message: 'Pagamento registrado (mock).' });
  }
  if (method === 'PATCH' && url.match(/\/lavajato\/queue\/[^/]+\/advance/)) {
    return ok({});
  }
  if (method === 'PATCH' && url.match(/\/lavajato\/queue\/[^/]+\/status/)) {
    return ok({});
  }
  if (method === 'POST' && url.startsWith('/lavajato/queue')) {
    const body = req.body as Record<string, unknown>;
    return ok({ ...body, id: `q-${Date.now()}`, status: 'AGUARDANDO', posicao: MOCK_QUEUE.length + 1, createdAt: new Date().toISOString() });
  }

  // ── Lavajato schedules ───────────────────────────────────────────────────
  if (method === 'GET' && url.startsWith('/lavajato/schedules')) {
    return ok(MOCK_SCHEDULES);
  }
  if (method === 'POST' && url.match(/\/lavajato\/schedules\/[^/]+\/payment/)) {
    return ok({ message: 'Pagamento registrado (mock).' });
  }
  if (method === 'PATCH' && url.match(/\/lavajato\/schedules\/[^/]+\/status/)) {
    return ok({});
  }
  if (method === 'POST' && url.startsWith('/lavajato/schedules')) {
    const body = req.body as Record<string, unknown>;
    return ok({ ...body, id: `sch-${Date.now()}`, status: 'AGENDADO' });
  }

  // ── Lavajato atendimentos ────────────────────────────────────────────────
  if (method === 'GET' && url.startsWith('/lavajato/atendimentos')) {
    return ok({
      agendados: MOCK_SCHEDULES,
      walkins: MOCK_QUEUE,
    });
  }

  // ── Rental contracts ─────────────────────────────────────────────────────
  if (method === 'GET' && url.match(/\/rental\/contracts\/[^?/]+$/)) {
    return ok({ ...MOCK_CONTRACTS[0], inspections: [], payments: [] });
  }
  if (method === 'PATCH' && url.match(/\/rental\/contracts\/[^/]+\/close/)) {
    return ok({ ...MOCK_CONTRACTS[0], status: 'ENCERRADO' });
  }
  if (method === 'PATCH' && url.match(/\/rental\/contracts\/[^/]+\/open/)) {
    return ok({ ...MOCK_CONTRACTS[0], status: 'ATIVO' });
  }
  if (method === 'PATCH' && url.match(/\/rental\/contracts\/[^/]+\/cancel/)) {
    return ok({ ...MOCK_CONTRACTS[0], status: 'CANCELADO' });
  }
  if (method === 'GET' && url.startsWith('/rental/contracts')) {
    return ok(paginated(MOCK_CONTRACTS));
  }
  if (method === 'POST' && url.match(/\/rental\/contracts\/[^/]+\/payment/)) {
    return ok({ message: 'Pagamento registrado (mock).' });
  }
  if (method === 'POST' && url.startsWith('/rental/contracts')) {
    const body = req.body as Record<string, unknown>;
    return ok({ ...body, id: `rc-${Date.now()}`, status: 'RESERVADO', createdAt: new Date().toISOString() });
  }
  if (method === 'PUT' && url.match(/\/rental\/contracts\/.+/)) {
    const body = req.body as Record<string, unknown>;
    return ok({ ...MOCK_CONTRACTS[0], ...body });
  }

  // ── Rental availability ──────────────────────────────────────────────────
  if (method === 'GET' && url.startsWith('/rental/available')) {
    return ok(MOCK_VEHICLES.filter(v => v.status === 'DISPONIVEL'));
  }

  // ── Templates ─────────────────────────────────────────────────────────────
  if (method === 'GET' && url.startsWith('/templates')) {
    return ok(MOCK_TEMPLATES);
  }
  if (method === 'POST' && url.startsWith('/templates')) {
    const body = req.body as Record<string, unknown>;
    return ok({ ...body, id: `tmpl-${Date.now()}`, ativo: true, createdAt: new Date().toISOString() });
  }
  if (method === 'PUT' && url.match(/\/templates\/.+/)) {
    const body = req.body as Record<string, unknown>;
    return ok({ ...MOCK_TEMPLATES[0], ...body });
  }
  if (method === 'DELETE' && url.match(/\/templates\/.+/)) {
    return ok({});
  }

  // ── Health ────────────────────────────────────────────────────────────────
  if (method === 'GET' && url.startsWith('/health')) {
    return ok({ status: 'ok' });
  }

  // ── Fallback: pass through (shouldn't happen in mock mode) ────────────────
  return next(req);
};

