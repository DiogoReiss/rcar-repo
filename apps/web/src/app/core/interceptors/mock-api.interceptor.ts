import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';

// ─── Date helpers ─────────────────────────────────────────────────────────────────────────────
const TODAY = new Date().toISOString().slice(0, 10);

function dt(date: string, hhmm: string) { return `${date}T${hhmm}:00.000Z`; }
function daysAgo(n: number): string { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); }
function daysFrom(n: number): string { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
function isoAgo(minutes: number) { return new Date(Date.now() - minutes * 60_000).toISOString(); }

// ─── Reference data ─────────────────────────────────────────────────────────────────────────

const MOCK_WASH_SERVICES = [
  { id: 'ws1', nome: 'Lavagem Simples',        descricao: 'Lavagem externa completa',              preco: 35,  duracaoMin: 30,  ativo: true,  createdAt: '2025-01-01T00:00:00Z' },
  { id: 'ws2', nome: 'Lavagem Completa',        descricao: 'Lavagem externa + interna',             preco: 65,  duracaoMin: 60,  ativo: true,  createdAt: '2025-01-01T00:00:00Z' },
  { id: 'ws3', nome: 'Polimento',               descricao: 'Polimento + cristalização',             preco: 180, duracaoMin: 120, ativo: true,  createdAt: '2025-01-01T00:00:00Z' },
  { id: 'ws4', nome: 'Higienização Interna',    descricao: 'Higienização interna completa',          preco: 120, duracaoMin: 90,  ativo: true,  createdAt: '2025-01-01T00:00:00Z' },
  { id: 'ws5', nome: 'Vitrificação',            descricao: 'Proteção cerâmica premium',              preco: 450, duracaoMin: 180, ativo: true,  createdAt: '2025-02-01T00:00:00Z' },
  { id: 'ws6', nome: 'Lavagem Simples + Cera',  descricao: 'Lavagem externa com aplicação de cera',  preco: 55,  duracaoMin: 45,  ativo: true,  createdAt: '2025-02-01T00:00:00Z' },
  { id: 'ws7', nome: 'Revitalização de Faróis', descricao: 'Polimento e proteção de faróis',         preco: 90,  duracaoMin: 60,  ativo: false, createdAt: '2025-03-01T00:00:00Z' },
];

const MOCK_CUSTOMERS = [
  { id: 'c1',  tipo: 'PF' as const, nome: 'Carlos Andrade',         cpfCnpj: '123.456.789-00',      email: 'carlos@mail.com',        telefone: '(11) 91234-5678', cnh: '12345678', cnhValidade: '2028-06-01', ativo: true,  createdAt: '2025-01-10T10:00:00Z' },
  { id: 'c2',  tipo: 'PF' as const, nome: 'Ana Beatriz Lima',        cpfCnpj: '987.654.321-00',      email: 'ana@mail.com',            telefone: '(21) 99876-5432', cnh: '87654321', cnhValidade: '2027-09-15', ativo: true,  createdAt: '2025-02-05T08:30:00Z' },
  { id: 'c3',  tipo: 'PJ' as const, nome: 'Logística Rápida Ltda',  cpfCnpj: '12.345.678/0001-90',  email: 'contato@logistica.com',   telefone: '(31) 3456-7890', razaoSocial: 'Logística Rápida Ltda', responsavel: 'Marcos Oliveira', ativo: true,  createdAt: '2025-03-01T09:00:00Z' },
  { id: 'c4',  tipo: 'PF' as const, nome: 'Fernanda Costa',          cpfCnpj: '321.654.987-11',      email: 'fernanda@mail.com',       telefone: '(41) 98765-4321', cnh: '54321678', cnhValidade: '2029-03-20', ativo: true,  createdAt: '2025-04-01T08:00:00Z' },
  { id: 'c5',  tipo: 'PF' as const, nome: 'Rafael Mendes',           cpfCnpj: '456.789.012-33',      email: 'rafael@mail.com',         telefone: '(51) 97654-3210', cnh: '98765432', cnhValidade: '2026-12-01', ativo: true,  createdAt: '2025-04-15T07:00:00Z' },
  { id: 'c6',  tipo: 'PF' as const, nome: 'Juliana Ferreira',        cpfCnpj: '654.321.098-55',      email: 'juliana@mail.com',        telefone: '(62) 98888-1111', cnh: '11223344', cnhValidade: '2030-01-10', ativo: true,  createdAt: '2025-05-20T09:00:00Z' },
  { id: 'c7',  tipo: 'PJ' as const, nome: 'Construtora Norte Ltda', cpfCnpj: '87.654.321/0001-55',  email: 'frota@norte.com.br',      telefone: '(85) 3321-9900', razaoSocial: 'Construtora Norte Ltda', responsavel: 'Eduardo Nunes', ativo: true,  createdAt: '2025-06-01T10:00:00Z' },
  { id: 'c8',  tipo: 'PF' as const, nome: 'Thiago Barbosa',          cpfCnpj: '789.012.345-77',      email: 'thiago@mail.com',         telefone: '(71) 97777-2222', cnh: '55443322', cnhValidade: '2027-07-01', ativo: true,  createdAt: '2025-07-10T08:00:00Z' },
  { id: 'c9',  tipo: 'PF' as const, nome: 'Patrícia Souza',          cpfCnpj: '111.222.333-44',      email: 'patricia@mail.com',       telefone: '(81) 96666-3333', cnh: '66554433', cnhValidade: '2028-11-20', ativo: true,  createdAt: '2025-08-05T07:30:00Z' },
  { id: 'c10', tipo: 'PJ' as const, nome: 'Turismo Brasil Ltda',     cpfCnpj: '55.432.100/0001-88',  email: 'frota@turismobr.com',     telefone: '(11) 3232-4545', razaoSocial: 'Turismo Brasil Ltda', responsavel: 'Sandra Pires', ativo: false, createdAt: '2025-09-01T09:00:00Z' },
  { id: 'c11', tipo: 'PF' as const, nome: 'Lucas Martins',           cpfCnpj: '222.333.444-99',      email: 'lucas@mail.com',          telefone: '(11) 95555-4444', cnh: '77665544', cnhValidade: '2031-04-15', ativo: true,  createdAt: '2026-01-05T08:00:00Z' },
  { id: 'c12', tipo: 'PF' as const, nome: 'Beatriz Alves',           cpfCnpj: '333.444.555-00',      email: 'beatriz@mail.com',        telefone: '(11) 94444-5555', cnh: '88776655', cnhValidade: '2029-08-30', ativo: true,  createdAt: '2026-02-10T09:00:00Z' },
];

const MOCK_VEHICLES = [
  { id: 'v1',  placa: 'ABC-1234', modelo: 'Onix 1.0',        ano: 2023, cor: 'Branco',   categoria: 'ECONOMICO'     as const, status: 'DISPONIVEL' as const, fotos: [], kmAtual: 15240, diariaPadrao: 100, createdAt: '2025-01-05T00:00:00Z' },
  { id: 'v2',  placa: 'DEF-5678', modelo: 'Corolla 2.0',     ano: 2022, cor: 'Prata',    categoria: 'INTERMEDIARIO' as const, status: 'ALUGADO'    as const, fotos: [], kmAtual: 42800, diariaPadrao: 180, createdAt: '2025-01-05T00:00:00Z' },
  { id: 'v3',  placa: 'GHI-9012', modelo: 'HR-V EXL',        ano: 2024, cor: 'Preto',    categoria: 'SUV'           as const, status: 'DISPONIVEL' as const, fotos: [], kmAtual: 6200,  diariaPadrao: 220, createdAt: '2025-02-10T00:00:00Z' },
  { id: 'v4',  placa: 'JKL-3456', modelo: 'S10 High',        ano: 2021, cor: 'Azul',     categoria: 'UTILITARIO'   as const, status: 'MANUTENCAO' as const, fotos: [], kmAtual: 88500, diariaPadrao: 240, createdAt: '2025-01-05T00:00:00Z' },
  { id: 'v5',  placa: 'MNO-7890', modelo: 'Renegade Sport',  ano: 2023, cor: 'Vermelho', categoria: 'SUV'           as const, status: 'DISPONIVEL' as const, fotos: [], kmAtual: 22100, diariaPadrao: 210, createdAt: '2025-03-01T00:00:00Z' },
  { id: 'v6',  placa: 'PQR-2345', modelo: 'Polo Track',      ano: 2024, cor: 'Cinza',    categoria: 'ECONOMICO'     as const, status: 'DISPONIVEL' as const, fotos: [], kmAtual: 4800,  diariaPadrao: 95,  createdAt: '2025-04-01T00:00:00Z' },
  { id: 'v7',  placa: 'STU-6789', modelo: 'Compass Limited', ano: 2024, cor: 'Branco',   categoria: 'SUV'           as const, status: 'DISPONIVEL' as const, fotos: [], kmAtual: 9300,  diariaPadrao: 280, createdAt: '2025-05-01T00:00:00Z' },
  { id: 'v8',  placa: 'VWX-0123', modelo: 'Hilux SW4',       ano: 2022, cor: 'Preto',    categoria: 'SUV'           as const, status: 'ALUGADO'    as const, fotos: [], kmAtual: 56200, diariaPadrao: 320, createdAt: '2025-06-01T00:00:00Z' },
  { id: 'v9',  placa: 'YZA-4567', modelo: 'Virtus 1.0',      ano: 2023, cor: 'Azul',     categoria: 'ECONOMICO'     as const, status: 'DISPONIVEL' as const, fotos: [], kmAtual: 18700, diariaPadrao: 110, createdAt: '2025-07-01T00:00:00Z' },
  { id: 'v10', placa: 'BCD-8901', modelo: 'Tracker Premier', ano: 2023, cor: 'Prata',    categoria: 'SUV'           as const, status: 'DISPONIVEL' as const, fotos: [], kmAtual: 31400, diariaPadrao: 230, createdAt: '2025-08-01T00:00:00Z' },
  { id: 'v11', placa: 'EFG-2345', modelo: 'Kwid Intense',    ano: 2023, cor: 'Laranja',  categoria: 'ECONOMICO'     as const, status: 'MANUTENCAO' as const, fotos: [], kmAtual: 44900, diariaPadrao: 85,  createdAt: '2025-09-01T00:00:00Z' },
  { id: 'v12', placa: 'HIJ-6789', modelo: 'Argo Drive',      ano: 2024, cor: 'Branco',   categoria: 'ECONOMICO'     as const, status: 'DISPONIVEL' as const, fotos: [], kmAtual: 2100,  diariaPadrao: 90,  createdAt: '2025-10-01T00:00:00Z' },
];

const MOCK_PRODUCTS = [
  { id: 'p1',  nome: 'Shampoo Automotivo 5L',        unidade: 'un',  quantidadeAtual: 8,  estoqueMinimo: 5,  custoUnitario: 42.50, ativo: true, createdAt: '2025-01-01T00:00:00Z' },
  { id: 'p2',  nome: 'Cera Líquida 500ml',            unidade: 'un',  quantidadeAtual: 3,  estoqueMinimo: 5,  custoUnitario: 28.90, ativo: true, createdAt: '2025-01-01T00:00:00Z' },
  { id: 'p3',  nome: 'Microfibra 40x40',              unidade: 'un',  quantidadeAtual: 20, estoqueMinimo: 10, custoUnitario: 8.00,  ativo: true, createdAt: '2025-01-01T00:00:00Z' },
  { id: 'p4',  nome: 'Detergente Desengraxante 1L',   unidade: 'un',  quantidadeAtual: 4,  estoqueMinimo: 8,  custoUnitario: 15.00, ativo: true, createdAt: '2025-01-01T00:00:00Z' },
  { id: 'p5',  nome: 'Silicone Spray 300ml',          unidade: 'un',  quantidadeAtual: 12, estoqueMinimo: 6,  custoUnitario: 19.90, ativo: true, createdAt: '2025-01-01T00:00:00Z' },
  { id: 'p6',  nome: 'Cera de Carnaúba 400g',          unidade: 'un',  quantidadeAtual: 5,  estoqueMinimo: 4,  custoUnitario: 38.00, ativo: true, createdAt: '2025-02-01T00:00:00Z' },
  { id: 'p7',  nome: 'Selante de Pneus 1L',           unidade: 'un',  quantidadeAtual: 7,  estoqueMinimo: 3,  custoUnitario: 24.50, ativo: true, createdAt: '2025-02-01T00:00:00Z' },
  { id: 'p8',  nome: 'Limpa Vidros 500ml',             unidade: 'un',  quantidadeAtual: 2,  estoqueMinimo: 6,  custoUnitario: 12.00, ativo: true, createdAt: '2025-03-01T00:00:00Z' },
  { id: 'p9',  nome: 'Luva de Borracha (par)',          unidade: 'par', quantidadeAtual: 15, estoqueMinimo: 10, custoUnitario: 6.50,  ativo: true, createdAt: '2025-03-01T00:00:00Z' },
  { id: 'p10', nome: 'Esponja de Polimento 6"',        unidade: 'un',  quantidadeAtual: 9,  estoqueMinimo: 8,  custoUnitario: 22.00, ativo: true, createdAt: '2025-04-01T00:00:00Z' },
  { id: 'p11', nome: 'Removedor de Insetos 500ml',     unidade: 'un',  quantidadeAtual: 1,  estoqueMinimo: 4,  custoUnitario: 18.00, ativo: true, createdAt: '2025-04-01T00:00:00Z' },
  { id: 'p12', nome: 'Protetor de Plásticos 400ml',   unidade: 'un',  quantidadeAtual: 6,  estoqueMinimo: 4,  custoUnitario: 22.50, ativo: true, createdAt: '2025-05-01T00:00:00Z' },
];

// ─── Users ────────────────────────────────────────────────────────────────────────────────
const MOCK_ADMIN_USER    = { id: 'u1', nome: 'Administrador Geral', email: 'admin@rcar.dev',    role: 'GESTOR_GERAL' as const, ativo: true,  createdAt: '2025-01-01T00:00:00Z' };
const MOCK_OPERADOR_USER = { id: 'u2', nome: 'Rodrigo Silva',       email: 'operador@rcar.dev', role: 'OPERADOR'     as const, ativo: true,  createdAt: '2025-02-01T00:00:00Z' };
const MOCK_CLIENT_USER   = { id: 'u3', nome: 'Carlos Andrade',      email: 'cliente@rcar.dev',  role: 'CLIENTE'      as const, ativo: true,  createdAt: '2025-01-10T00:00:00Z' };

let mockCurrentUser: typeof MOCK_ADMIN_USER | typeof MOCK_OPERADOR_USER | typeof MOCK_CLIENT_USER = MOCK_ADMIN_USER;
const CLIENT_CUSTOMER_ID = 'c1';

const MOCK_USERS_LIST: Record<string, unknown>[] = [
  MOCK_ADMIN_USER,
  MOCK_OPERADOR_USER,
  { id: 'u4', nome: 'Patrícia Nunes',  email: 'patricia.n@rcar.dev', role: 'OPERADOR'     as const, ativo: true,  createdAt: '2025-03-15T00:00:00Z' },
  { id: 'u5', nome: 'Diego Carvalho',  email: 'diego@rcar.dev',      role: 'GESTOR_GERAL' as const, ativo: false, createdAt: '2025-04-01T00:00:00Z' },
];

// ─── Mutable schedules ──────────────────────────────────────────────────────────────────
let mockSchedules: Record<string, unknown>[] = [
  // Today
  { id: 's1',  nomeAvulso: 'Maria Santos',    telefone: '(11) 98001-1111', serviceId: 'ws1', dataHora: dt(TODAY, '08:00'), status: 'CONCLUIDO',      service: MOCK_WASH_SERVICES[0] },
  { id: 's2',  customerId: 'c2',  serviceId: 'ws2', dataHora: dt(TODAY, '09:00'), status: 'EM_ATENDIMENTO', service: MOCK_WASH_SERVICES[1], customer: { id: 'c2', nome: 'Ana Beatriz Lima',   telefone: '(21) 99876-5432' } },
  { id: 's3',  customerId: 'c1',  serviceId: 'ws1', dataHora: dt(TODAY, '10:00'), status: 'AGENDADO',       service: MOCK_WASH_SERVICES[0], customer: { id: 'c1', nome: 'Carlos Andrade',     telefone: '(11) 91234-5678' }, observacoes: 'Cliente preferencial — atenção ao acabamento' },
  { id: 's4',  nomeAvulso: 'Pedro Alves',     telefone: '(31) 97002-2222', serviceId: 'ws3', dataHora: dt(TODAY, '11:00'), status: 'AGENDADO',       service: MOCK_WASH_SERVICES[2], observacoes: 'Polimento completo incluindo rodas' },
  { id: 's5',  customerId: 'c4',  serviceId: 'ws4', dataHora: dt(TODAY, '13:30'), status: 'AGENDADO',       service: MOCK_WASH_SERVICES[3], customer: { id: 'c4', nome: 'Fernanda Costa',     telefone: '(41) 98765-4321' } },
  { id: 's6',  customerId: 'c6',  serviceId: 'ws6', dataHora: dt(TODAY, '14:30'), status: 'AGENDADO',       service: MOCK_WASH_SERVICES[5], customer: { id: 'c6', nome: 'Juliana Ferreira',   telefone: '(62) 98888-1111' } },
  { id: 's7',  nomeAvulso: 'Sandro Reis',     telefone: '(41) 96003-3333', serviceId: 'ws2', dataHora: dt(TODAY, '15:30'), status: 'AGENDADO',       service: MOCK_WASH_SERVICES[1] },
  { id: 's8',  customerId: 'c11', serviceId: 'ws5', dataHora: dt(TODAY, '16:00'), status: 'CANCELADO',      service: MOCK_WASH_SERVICES[4], customer: { id: 'c11', nome: 'Lucas Martins',     telefone: '(11) 95555-4444' } },
  // Yesterday
  { id: 's9',  nomeAvulso: 'João da Silva',   telefone: '(51) 95004-4444', serviceId: 'ws2', dataHora: dt(daysAgo(1), '09:00'), status: 'CONCLUIDO', service: MOCK_WASH_SERVICES[1] },
  { id: 's10', customerId: 'c1',  serviceId: 'ws1', dataHora: dt(daysAgo(1), '10:30'), status: 'CONCLUIDO', service: MOCK_WASH_SERVICES[0], customer: { id: 'c1', nome: 'Carlos Andrade',     telefone: '(11) 91234-5678' } },
  { id: 's11', customerId: 'c8',  serviceId: 'ws4', dataHora: dt(daysAgo(1), '13:00'), status: 'CONCLUIDO', service: MOCK_WASH_SERVICES[3], customer: { id: 'c8', nome: 'Thiago Barbosa',     telefone: '(71) 97777-2222' } },
  { id: 's12', customerId: 'c9',  serviceId: 'ws6', dataHora: dt(daysAgo(1), '15:00'), status: 'CANCELADO', service: MOCK_WASH_SERVICES[5], customer: { id: 'c9', nome: 'Patrícia Souza',     telefone: '(81) 96666-3333' } },
  // 2 days ago
  { id: 's13', nomeAvulso: 'Cláudio Pires',   telefone: '(62) 94005-5555', serviceId: 'ws1', dataHora: dt(daysAgo(2), '08:30'), status: 'CONCLUIDO', service: MOCK_WASH_SERVICES[0] },
  { id: 's14', customerId: 'c5',  serviceId: 'ws3', dataHora: dt(daysAgo(2), '11:00'), status: 'CONCLUIDO', service: MOCK_WASH_SERVICES[2], customer: { id: 'c5', nome: 'Rafael Mendes',      telefone: '(51) 97654-3210' } },
  { id: 's15', customerId: 'c2',  serviceId: 'ws2', dataHora: dt(daysAgo(2), '14:00'), status: 'CONCLUIDO', service: MOCK_WASH_SERVICES[1], customer: { id: 'c2', nome: 'Ana Beatriz Lima',   telefone: '(21) 99876-5432' } },
  // Older
  { id: 's16', nomeAvulso: 'Renata Mota',      telefone: '(71) 93006-6666', serviceId: 'ws6', dataHora: dt(daysAgo(3),  '09:30'), status: 'CONCLUIDO', service: MOCK_WASH_SERVICES[5] },
  { id: 's17', customerId: 'c12', serviceId: 'ws4', dataHora: dt(daysAgo(3),  '11:30'), status: 'CONCLUIDO', service: MOCK_WASH_SERVICES[3], customer: { id: 'c12', nome: 'Beatriz Alves', telefone: '(11) 94444-5555' } },
  { id: 's18', customerId: 'c1',  serviceId: 'ws2', dataHora: dt(daysAgo(7),  '10:00'), status: 'CONCLUIDO', service: MOCK_WASH_SERVICES[1], customer: { id: 'c1',  nome: 'Carlos Andrade',   telefone: '(11) 91234-5678' } },
  { id: 's19', customerId: 'c4',  serviceId: 'ws5', dataHora: dt(daysAgo(7),  '14:00'), status: 'CONCLUIDO', service: MOCK_WASH_SERVICES[4], customer: { id: 'c4',  nome: 'Fernanda Costa',   telefone: '(41) 98765-4321' } },
  { id: 's20', customerId: 'c1',  serviceId: 'ws4', dataHora: dt(daysAgo(14), '09:00'), status: 'CONCLUIDO', service: MOCK_WASH_SERVICES[3], customer: { id: 'c1',  nome: 'Carlos Andrade',   telefone: '(11) 91234-5678' } },
  { id: 's21', nomeAvulso: 'Marcos Lima',       telefone: '(85) 92007-7777', serviceId: 'ws3', dataHora: dt(daysAgo(14), '15:00'), status: 'CONCLUIDO', service: MOCK_WASH_SERVICES[2] },
  { id: 's22', customerId: 'c1',  serviceId: 'ws1', dataHora: dt(daysAgo(21), '14:00'), status: 'CONCLUIDO', service: MOCK_WASH_SERVICES[0], customer: { id: 'c1',  nome: 'Carlos Andrade',   telefone: '(11) 91234-5678' } },
  { id: 's23', customerId: 'c1',  serviceId: 'ws3', dataHora: dt(daysAgo(30), '11:00'), status: 'CANCELADO', service: MOCK_WASH_SERVICES[2], customer: { id: 'c1',  nome: 'Carlos Andrade',   telefone: '(11) 91234-5678' } },
  // Future
  { id: 's24', customerId: 'c5',  serviceId: 'ws2', dataHora: dt(daysFrom(1), '09:30'), status: 'AGENDADO', service: MOCK_WASH_SERVICES[1], customer: { id: 'c5',  nome: 'Rafael Mendes',    telefone: '(51) 97654-3210' } },
  { id: 's25', customerId: 'c1',  serviceId: 'ws3', dataHora: dt(daysFrom(1), '15:00'), status: 'AGENDADO', service: MOCK_WASH_SERVICES[2], customer: { id: 'c1',  nome: 'Carlos Andrade',   telefone: '(11) 91234-5678' } },
  { id: 's26', customerId: 'c11', serviceId: 'ws5', dataHora: dt(daysFrom(2), '10:00'), status: 'AGENDADO', service: MOCK_WASH_SERVICES[4], customer: { id: 'c11', nome: 'Lucas Martins',     telefone: '(11) 95555-4444' } },
  { id: 's27', nomeAvulso: 'Tiago Rios',        telefone: '(48) 91008-8888', serviceId: 'ws4', dataHora: dt(daysFrom(2), '14:00'), status: 'AGENDADO', service: MOCK_WASH_SERVICES[3] },
];

// ─── Mutable queue (4 waiting, 2 active, 3 done) ─────────────────────────────────────────────────────────────
let mockQueue: Record<string, unknown>[] = [
  { id: 'q1', nomeAvulso: 'João da Silva',   serviceId: 'ws1', veiculoPlaca: 'XYZ-9999', status: 'AGUARDANDO',     posicao: 1, createdAt: isoAgo(32),  service: MOCK_WASH_SERVICES[0] },
  { id: 'q2', customerId: 'c1',               serviceId: 'ws2', veiculoPlaca: 'ABC-1234', status: 'AGUARDANDO',     posicao: 2, createdAt: isoAgo(18),  service: MOCK_WASH_SERVICES[1], customer: { id: 'c1', nome: 'Carlos Andrade'   } },
  { id: 'q3', customerId: 'c4',               serviceId: 'ws4', veiculoPlaca: 'MNO-7890', status: 'AGUARDANDO',     posicao: 3, createdAt: isoAgo(9),   service: MOCK_WASH_SERVICES[3], customer: { id: 'c4', nome: 'Fernanda Costa'   } },
  { id: 'q4', nomeAvulso: 'Sandro Pires',     serviceId: 'ws6', veiculoPlaca: 'RST-3344', status: 'AGUARDANDO',     posicao: 4, createdAt: isoAgo(4),   service: MOCK_WASH_SERVICES[5] },
  { id: 'q5', customerId: 'c2',               serviceId: 'ws3', veiculoPlaca: 'DEF-5678', status: 'EM_ATENDIMENTO', posicao: 1, createdAt: isoAgo(65),  service: MOCK_WASH_SERVICES[2], customer: { id: 'c2', nome: 'Ana Beatriz Lima' } },
  { id: 'q6', nomeAvulso: 'Débora Moraes',   serviceId: 'ws2', veiculoPlaca: 'GHI-9012', status: 'EM_ATENDIMENTO', posicao: 2, createdAt: isoAgo(40),  service: MOCK_WASH_SERVICES[1] },
  { id: 'q7', nomeAvulso: 'Marcos Lima',      serviceId: 'ws1', veiculoPlaca: 'PQR-0001', status: 'CONCLUIDO',      posicao: 1, createdAt: isoAgo(120), concluidoAt: isoAgo(90),  service: MOCK_WASH_SERVICES[0] },
  { id: 'q8', customerId: 'c8',               serviceId: 'ws4', veiculoPlaca: 'BCD-8901', status: 'CONCLUIDO',      posicao: 2, createdAt: isoAgo(180), concluidoAt: isoAgo(130), service: MOCK_WASH_SERVICES[3], customer: { id: 'c8', nome: 'Thiago Barbosa'  } },
  { id: 'q9', nomeAvulso: 'Rosa Pereira',     serviceId: 'ws6', veiculoPlaca: 'EFG-2345', status: 'CONCLUIDO',      posicao: 3, createdAt: isoAgo(240), concluidoAt: isoAgo(195), service: MOCK_WASH_SERVICES[5] },
];

// ─── Mutable contracts ──────────────────────────────────────────────────────────────────────────────
let mockContracts: Record<string, unknown>[] = [
  { id: 'rc1',  customerId: 'c1',  vehicleId: 'v2',  modalidade: 'DIARIA'  as const, dataRetirada: '2026-05-01T10:00:00Z',    dataDevolucao: '2026-05-05T10:00:00Z',    valorDiaria: 180, valorTotal: 720,  seguro: true,  valorSeguro: 72,  status: 'ATIVO'     as const, kmRetirada: 42000, kmLimite: 200, combustivelSaida: 'CHEIO', createdAt: '2026-05-01T09:00:00Z',    customer: { id: 'c1',  nome: 'Carlos Andrade',         cpfCnpj: '123.456.789-00'      }, vehicle: { id: 'v2',  placa: 'DEF-5678', modelo: 'Corolla 2.0',   kmAtual: 42800 } },
  { id: 'rc2',  customerId: 'c8',  vehicleId: 'v8',  modalidade: 'SEMANAL' as const, dataRetirada: daysAgo(3)+'T10:00:00Z',   dataDevolucao: daysFrom(4)+'T10:00:00Z',  valorDiaria: 320, valorTotal: 2240, seguro: true,  valorSeguro: 224, status: 'ATIVO'     as const, kmRetirada: 56000, kmLimite: 300, combustivelSaida: 'CHEIO', createdAt: daysAgo(3)+'T09:00:00Z',   customer: { id: 'c8',  nome: 'Thiago Barbosa',          cpfCnpj: '789.012.345-77'      }, vehicle: { id: 'v8',  placa: 'VWX-0123', modelo: 'Hilux SW4',      kmAtual: 56200 } },
  { id: 'rc3',  customerId: 'c1',  vehicleId: 'v3',  modalidade: 'DIARIA'  as const, dataRetirada: daysFrom(2)+'T10:00:00Z',  dataDevolucao: daysFrom(6)+'T10:00:00Z',  valorDiaria: 220, valorTotal: 880,  seguro: true,  valorSeguro: 88,  status: 'RESERVADO' as const,                                                         createdAt: new Date().toISOString(),  customer: { id: 'c1',  nome: 'Carlos Andrade',         cpfCnpj: '123.456.789-00'      }, vehicle: { id: 'v3',  placa: 'GHI-9012', modelo: 'HR-V EXL',       kmAtual: 6200  } },
  { id: 'rc4',  customerId: 'c4',  vehicleId: 'v6',  modalidade: 'DIARIA'  as const, dataRetirada: daysFrom(1)+'T10:00:00Z',  dataDevolucao: daysFrom(4)+'T10:00:00Z',  valorDiaria: 95,  valorTotal: 285,  seguro: false,                   status: 'RESERVADO' as const,                                                         createdAt: new Date().toISOString(),  customer: { id: 'c4',  nome: 'Fernanda Costa',         cpfCnpj: '321.654.987-11'      }, vehicle: { id: 'v6',  placa: 'PQR-2345', modelo: 'Polo Track',     kmAtual: 4800  } },
  { id: 'rc5',  customerId: 'c7',  vehicleId: 'v7',  modalidade: 'MENSAL'  as const, dataRetirada: daysFrom(5)+'T08:00:00Z',  dataDevolucao: daysFrom(35)+'T08:00:00Z', valorDiaria: 280, valorTotal: 8400, seguro: true,  valorSeguro: 840, status: 'RESERVADO' as const,                                                         createdAt: new Date().toISOString(),  customer: { id: 'c7',  nome: 'Construtora Norte Ltda', cpfCnpj: '87.654.321/0001-55' }, vehicle: { id: 'v7',  placa: 'STU-6789', modelo: 'Compass Limited', kmAtual: 9300  } },
  { id: 'rc6',  customerId: 'c2',  vehicleId: 'v1',  modalidade: 'SEMANAL' as const, dataRetirada: '2026-04-20T10:00:00Z',    dataDevolucao: '2026-04-27T10:00:00Z', dataDevReal: '2026-04-27T09:30:00Z', valorDiaria: 100, valorTotal: 700,  seguro: false,                   status: 'ENCERRADO' as const, kmRetirada: 14800, kmLimite: 200, combustivelSaida: 'CHEIO', createdAt: '2026-04-20T09:00:00Z',    customer: { id: 'c2',  nome: 'Ana Beatriz Lima',      cpfCnpj: '987.654.321-00'      }, vehicle: { id: 'v1',  placa: 'ABC-1234', modelo: 'Onix 1.0',       kmAtual: 15240 } },
  { id: 'rc7',  customerId: 'c1',  vehicleId: 'v6',  modalidade: 'DIARIA'  as const, dataRetirada: '2026-03-10T10:00:00Z',    dataDevolucao: '2026-03-13T10:00:00Z', dataDevReal: '2026-03-13T09:00:00Z', valorDiaria: 95,  valorTotal: 285,  seguro: false,                   status: 'ENCERRADO' as const, kmRetirada: 4200,  kmLimite: 200, combustivelSaida: 'CHEIO', createdAt: '2026-03-10T09:00:00Z',    customer: { id: 'c1',  nome: 'Carlos Andrade',         cpfCnpj: '123.456.789-00'      }, vehicle: { id: 'v6',  placa: 'PQR-2345', modelo: 'Polo Track',     kmAtual: 4800  } },
  { id: 'rc8',  customerId: 'c1',  vehicleId: 'v5',  modalidade: 'SEMANAL' as const, dataRetirada: '2026-01-15T10:00:00Z',    dataDevolucao: '2026-01-22T10:00:00Z', dataDevReal: '2026-01-22T11:00:00Z', valorDiaria: 210, valorTotal: 1470, seguro: true,  valorSeguro: 147, status: 'ENCERRADO' as const, kmRetirada: 20000, kmLimite: 300, combustivelSaida: 'CHEIO', createdAt: '2026-01-15T09:00:00Z',    customer: { id: 'c1',  nome: 'Carlos Andrade',         cpfCnpj: '123.456.789-00'      }, vehicle: { id: 'v5',  placa: 'MNO-7890', modelo: 'Renegade Sport',  kmAtual: 22100 } },
  { id: 'rc9',  customerId: 'c11', vehicleId: 'v10', modalidade: 'DIARIA'  as const, dataRetirada: daysAgo(6)+'T10:00:00Z',   dataDevolucao: daysAgo(3)+'T10:00:00Z', dataDevReal:  daysAgo(3)+'T09:00:00Z',  valorDiaria: 230, valorTotal: 690,  seguro: false,                   status: 'ENCERRADO' as const, kmRetirada: 31000, kmLimite: 200, combustivelSaida: 'CHEIO', createdAt: daysAgo(6)+'T09:00:00Z',   customer: { id: 'c11', nome: 'Lucas Martins',          cpfCnpj: '222.333.444-99'      }, vehicle: { id: 'v10', placa: 'BCD-8901', modelo: 'Tracker Premier', kmAtual: 31400 } },
  { id: 'rc10', customerId: 'c5',  vehicleId: 'v9',  modalidade: 'DIARIA'  as const, dataRetirada: '2026-04-01T10:00:00Z',    dataDevolucao: '2026-04-04T10:00:00Z',                                         valorDiaria: 110, valorTotal: 330,  seguro: false,                   status: 'CANCELADO' as const,                                                         createdAt: '2026-03-28T10:00:00Z',    customer: { id: 'c5',  nome: 'Rafael Mendes',          cpfCnpj: '456.789.012-33'      }, vehicle: { id: 'v9',  placa: 'YZA-4567', modelo: 'Virtus 1.0',     kmAtual: 18700 } },
];

// ─── Stock movements ─────────────────────────────────────────────────────────────────────────────
const MOCK_STOCK_MOVEMENTS: Record<string, unknown>[] = [
  { id: 'sm1',  productId: 'p1',  tipo: 'ENTRADA', quantidade: 10, motivo: 'Compra — Fornecedor ABC',         createdAt: daysAgo(14)+'T08:00:00Z', product: { nome: 'Shampoo Automotivo 5L',      unidade: 'un'  } },
  { id: 'sm2',  productId: 'p3',  tipo: 'ENTRADA', quantidade: 20, motivo: 'Compra — Fornecedor ABC',         createdAt: daysAgo(14)+'T08:05:00Z', product: { nome: 'Microfibra 40x40',            unidade: 'un'  } },
  { id: 'sm3',  productId: 'p9',  tipo: 'ENTRADA', quantidade: 15, motivo: 'Compra — Fornecedor ABC',         createdAt: daysAgo(14)+'T08:10:00Z', product: { nome: 'Luva de Borracha (par)',       unidade: 'par' } },
  { id: 'sm4',  productId: 'p2',  tipo: 'SAIDA',   quantidade: 2,  motivo: 'Uso — polimento v.DEF-5678',      createdAt: daysAgo(10)+'T10:00:00Z', product: { nome: 'Cera Líquida 500ml',          unidade: 'un'  } },
  { id: 'sm5',  productId: 'p4',  tipo: 'SAIDA',   quantidade: 3,  motivo: 'Uso — lavagem completa',          createdAt: daysAgo(10)+'T10:30:00Z', product: { nome: 'Detergente Desengraxante 1L', unidade: 'un'  } },
  { id: 'sm6',  productId: 'p1',  tipo: 'SAIDA',   quantidade: 2,  motivo: 'Uso — 3 lavagens simples',        createdAt: daysAgo(7) +'T09:00:00Z', product: { nome: 'Shampoo Automotivo 5L',      unidade: 'un'  } },
  { id: 'sm7',  productId: 'p5',  tipo: 'SAIDA',   quantidade: 1,  motivo: 'Uso — higienização interna',      createdAt: daysAgo(7) +'T11:00:00Z', product: { nome: 'Silicone Spray 300ml',        unidade: 'un'  } },
  { id: 'sm8',  productId: 'p6',  tipo: 'ENTRADA', quantidade: 6,  motivo: 'Compra — Distribuidora Sul',      createdAt: daysAgo(5) +'T08:00:00Z', product: { nome: 'Cera de Carnaúba 400g',       unidade: 'un'  } },
  { id: 'sm9',  productId: 'p8',  tipo: 'ENTRADA', quantidade: 8,  motivo: 'Compra — Distribuidora Sul',      createdAt: daysAgo(5) +'T08:05:00Z', product: { nome: 'Limpa Vidros 500ml',          unidade: 'un'  } },
  { id: 'sm10', productId: 'p11', tipo: 'ENTRADA', quantidade: 5,  motivo: 'Compra — Distribuidora Sul',      createdAt: daysAgo(5) +'T08:10:00Z', product: { nome: 'Removedor de Insetos 500ml',  unidade: 'un'  } },
  { id: 'sm11', productId: 'p3',  tipo: 'SAIDA',   quantidade: 4,  motivo: 'Uso — lavagem completa (semana)', createdAt: daysAgo(4) +'T16:00:00Z', product: { nome: 'Microfibra 40x40',            unidade: 'un'  } },
  { id: 'sm12', productId: 'p10', tipo: 'SAIDA',   quantidade: 1,  motivo: 'Uso — polimento + cristalização', createdAt: daysAgo(3) +'T10:00:00Z', product: { nome: 'Esponja de Polimento 6"',     unidade: 'un'  } },
  { id: 'sm13', productId: 'p4',  tipo: 'SAIDA',   quantidade: 1,  motivo: 'Uso — lavagem interna',           createdAt: daysAgo(3) +'T11:00:00Z', product: { nome: 'Detergente Desengraxante 1L', unidade: 'un'  } },
  { id: 'sm14', productId: 'p8',  tipo: 'SAIDA',   quantidade: 3,  motivo: 'Uso — lavagem vidros (semana)',   createdAt: daysAgo(2) +'T09:00:00Z', product: { nome: 'Limpa Vidros 500ml',          unidade: 'un'  } },
  { id: 'sm15', productId: 'p2',  tipo: 'SAIDA',   quantidade: 1,  motivo: 'Uso — cera pós-polimento',        createdAt: daysAgo(1) +'T14:00:00Z', product: { nome: 'Cera Líquida 500ml',          unidade: 'un'  } },
  { id: 'sm16', productId: 'p11', tipo: 'SAIDA',   quantidade: 2,  motivo: 'Uso — pré-lavagem',               createdAt: daysAgo(1) +'T15:00:00Z', product: { nome: 'Removedor de Insetos 500ml',  unidade: 'un'  } },
  { id: 'sm17', productId: 'p1',  tipo: 'AJUSTE',  quantidade: 1,  motivo: 'Ajuste de inventário',             createdAt: TODAY     +'T08:00:00Z', product: { nome: 'Shampoo Automotivo 5L',      unidade: 'un'  } },
];

// ─── Vehicle maintenances ────────────────────────────────────────────────────────────────────
let mockMaintenances: Record<string, unknown>[] = [
  // v4 — S10 High (MANUTENCAO)
  { id: 'mt1', vehicleId: 'v4', descricao: 'Troca de correia dentada',        custo: 620,  data: daysAgo(45)+'T12:00:00Z', createdAt: daysAgo(45)+'T12:00:00Z' },
  { id: 'mt2', vehicleId: 'v4', descricao: 'Revisão de freios dianteiros',    custo: 380,  data: daysAgo(30)+'T12:00:00Z', createdAt: daysAgo(30)+'T12:00:00Z' },
  { id: 'mt3', vehicleId: 'v4', descricao: 'Troca de óleo + filtros',         custo: 220,  data: daysAgo(10)+'T12:00:00Z', createdAt: daysAgo(10)+'T12:00:00Z' },
  { id: 'mt4', vehicleId: 'v4', descricao: 'Serviço de alinhamento e balanceamento', custo: 180, data: daysAgo(3)+'T12:00:00Z',  createdAt: daysAgo(3)+'T12:00:00Z' },
  // v11 — Kwid Intense (MANUTENCAO)
  { id: 'mt5', vehicleId: 'v11', descricao: 'Troca de velas e cabos',         custo: 290,  data: daysAgo(20)+'T12:00:00Z', createdAt: daysAgo(20)+'T12:00:00Z' },
  { id: 'mt6', vehicleId: 'v11', descricao: 'Reparo no sistema de arrefecimento', custo: 450, data: daysAgo(5)+'T12:00:00Z', createdAt: daysAgo(5)+'T12:00:00Z' },
  // v2 — Corolla 2.0 (past maintenances, now ALUGADO)
  { id: 'mt7', vehicleId: 'v2', descricao: 'Troca de óleo 5W30',              custo: 180,  data: daysAgo(90)+'T12:00:00Z', createdAt: daysAgo(90)+'T12:00:00Z' },
  { id: 'mt8', vehicleId: 'v2', descricao: 'Revisão dos 40.000 km',           custo: 850,  data: daysAgo(60)+'T12:00:00Z', createdAt: daysAgo(60)+'T12:00:00Z' },
  // v8 — Hilux SW4 (past maintenances)
  { id: 'mt9',  vehicleId: 'v8', descricao: 'Troca de filtro de combustível', custo: 120,  data: daysAgo(120)+'T12:00:00Z', createdAt: daysAgo(120)+'T12:00:00Z' },
  { id: 'mt10', vehicleId: 'v8', descricao: 'Troca de óleo + filtro de óleo', custo: 280,  data: daysAgo(50)+'T12:00:00Z',  createdAt: daysAgo(50)+'T12:00:00Z' },
  // v3 — HR-V EXL (one maintenance)
  { id: 'mt11', vehicleId: 'v3', descricao: 'Alinhamento e balanceamento 4 rodas', custo: 160, data: daysAgo(15)+'T12:00:00Z', createdAt: daysAgo(15)+'T12:00:00Z' },
];

// ─── Templates ─────────────────────────────────────────────────────────────────────────────────
const MOCK_TEMPLATES = [
  { id: 't1', nome: 'Contrato de Locação', tipo: 'CONTRATO_LOCACAO' as const, ativo: true, createdAt: '2025-01-01T00:00:00Z', variaveis: ['nomeCliente', 'cpfCnpj', 'veiculo', 'placa', 'dataRetirada', 'dataDevolucao', 'valorTotal'], conteudoHtml: '<h2>Contrato de Locação</h2><p><strong>Locatário:</strong> {{nomeCliente}} — {{cpfCnpj}}</p><p><strong>Veículo:</strong> {{veiculo}} — {{placa}}</p><p><strong>Período:</strong> {{dataRetirada}} a {{dataDevolucao}}</p><p><strong>Total:</strong> R$ {{valorTotal}}</p>' },
  { id: 't2', nome: 'Recibo de Lavagem',   tipo: 'RECIBO_LAVAGEM'   as const, ativo: true, createdAt: '2025-01-01T00:00:00Z', variaveis: ['nomeCliente', 'servico', 'placa', 'valor', 'data'], conteudoHtml: '<h2>Recibo de Lavagem</h2><p><strong>Cliente:</strong> {{nomeCliente}}</p><p><strong>Serviço:</strong> {{servico}}</p><p><strong>Placa:</strong> {{placa}}</p><p><strong>Data:</strong> {{data}}</p><p style="font-size:18px"><strong>Total: R$ {{valor}}</strong></p>' },
  { id: 't3', nome: 'Termo de Vistoria',   tipo: 'VISTORIA'         as const, ativo: true, createdAt: '2025-06-01T00:00:00Z', variaveis: ['nomeCliente', 'veiculo', 'placa', 'km', 'data', 'tipo'], conteudoHtml: '<h2>Termo de Vistoria — {{tipo}}</h2><p><strong>Data:</strong> {{data}} | <strong>Veículo:</strong> {{veiculo}} {{placa}} | <strong>KM:</strong> {{km}}</p><p><strong>Cliente:</strong> {{nomeCliente}}</p>' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────────────────
function qs(url: string): URLSearchParams { return new URLSearchParams(url.includes('?') ? url.split('?')[1] : ''); }
function paginated<T>(data: T[], page = 1, perPage = 20) {
  const start = (page - 1) * perPage;
  return { data: data.slice(start, start + perPage), total: data.length, page, perPage, totalPages: Math.ceil(data.length / perPage) };
}
function ok<T>(body: T) { return of(new HttpResponse({ status: 200, body })); }

// ─── Interceptor ─────────────────────────────────────────────────────────────────────────────
export const mockApiInterceptor: HttpInterceptorFn = (req, next) => {
  const url = req.url.replace(/^https?:\/\/[^/]+(\/api)?/, '');
  const method = req.method.toUpperCase();
  const params = qs(url);
  const path   = url.split('?')[0];

  // ── Auth ──────────────────────────────────────────────────────────────────────────────────
  if (method === 'POST' && path === '/auth/login') {
    const { email } = (req.body ?? {}) as { email?: string };
    if      (email === 'operador@rcar.dev') mockCurrentUser = MOCK_OPERADOR_USER;
    else if (email === 'cliente@rcar.dev')  mockCurrentUser = MOCK_CLIENT_USER;
    else                                    mockCurrentUser = MOCK_ADMIN_USER;
    return ok({ accessToken: 'mock-access-token', refreshToken: 'mock-refresh-token', user: mockCurrentUser });
  }
  if (method === 'GET'  && path === '/auth/me')   return ok(mockCurrentUser);
  if (method === 'POST' && (path === '/auth/logout' || path === '/auth/refresh')) return ok({ accessToken: 'mock-access-token', refreshToken: 'mock-refresh-token' });
  if (method === 'POST' && path === '/auth/forgot-password') return ok({ message: 'E-mail enviado (mock).' });
  if (method === 'POST' && path === '/auth/reset-password')  return ok({ message: 'Senha redefinida (mock).' });

  // ── Reports ─────────────────────────────────────────────────────────────────────────────
  if (method === 'GET' && path === '/reports/dashboard') {
    return ok({ usersCount: MOCK_USERS_LIST.length, vehiclesCount: MOCK_VEHICLES.length, customersCount: MOCK_CUSTOMERS.length, servicesCount: MOCK_WASH_SERVICES.filter(s => s.ativo).length, lowStock: MOCK_PRODUCTS.filter(p => p.quantidadeAtual <= p.estoqueMinimo) });
  }
  if (method === 'GET' && path === '/reports/charts') {
    return ok({
      weeklyServices: { labels: ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'], data: [8,12,9,14,11,18,6] },
      rushHour:       { labels: ['07h','08h','09h','10h','11h','12h','13h','14h','15h','16h','17h','18h'], data: [1,4,9,11,8,4,5,12,14,9,6,2] },
      incomeOutcome:  { labels: ['Jan','Fev','Mar','Abr','Mai'], income: [5400,6200,5800,7100,6900], outcome: [12,18,14,21,17] },
      productUsage:   { labels: MOCK_PRODUCTS.slice(0,6).map(p => p.nome), data: [24,9,38,11,15,7] },
    });
  }
  if (method === 'GET' && path === '/reports/daily') {
    return ok({
      lavajato: { agendados: 8, concluidos: 6, cancelados: 1, walkins: 4, receita: 720, custoInsumos: 115 },
      aluguel: { novasReservas: 3, receita: 1080, custoManutencao: 240 },
      financeiro: { receitaTotal: 1800, custosDiretos: 355, margemBruta: 1445 },
    });
  }
  if (method === 'GET' && path === '/reports/monthly') {
    return ok({
      receita: { lavajato: 11400, aluguel: 22800, total: 34200 },
      custos: { insumos: 1980, manutencao: 4200, total: 6180 },
      faturamentoAluguel: { faturado: 25100, recebido: 22800, aReceber: 2300 },
      novosClientes: 12,
      novosContratos: 18,
    });
  }
  if (method === 'GET' && path === '/reports/financial-summary') {
    return ok({
      periodo: { from: params.get('from') ?? daysAgo(30), to: params.get('to') ?? daysAgo(0) },
      receita: { lavajato: 11400, aluguel: 22800, extrasAluguel: 1700, total: 35900 },
      custos: { insumos: 1980, manutencao: 4200, total: 6180 },
      margem: { bruta: 29720, percentual: 82.78 },
    });
  }
  if (method === 'GET' && path === '/reports/rental/receivables') {
    const data = [
      {
        contractId: 'rcv-1',
        customer: { id: 'c1', nome: 'Ana Souza', cpfCnpj: '123.456.789-00' },
        vehicle: { id: 'v1', placa: 'ABC1D23', modelo: 'Onix LT' },
        dataDevReal: `${daysAgo(2)}T10:00:00Z`,
        faturado: 1450,
        pago: 900,
        pendente: 550,
        payments: [{ id: 'p-r-1', valor: 900, metodo: 'PIX', createdAt: `${daysAgo(3)}T10:00:00Z` }],
      },
      {
        contractId: 'rcv-2',
        customer: { id: 'c3', nome: 'Carlos Lima', cpfCnpj: '456.123.987-11' },
        vehicle: { id: 'v3', placa: 'JKL9A81', modelo: 'Compass' },
        dataDevReal: `${daysAgo(1)}T16:00:00Z`,
        faturado: 2200,
        pago: 1200,
        pendente: 1000,
        payments: [{ id: 'p-r-2', valor: 1200, metodo: 'CARTAO_CREDITO', createdAt: `${daysAgo(1)}T18:00:00Z` }],
      },
    ];
    return ok({
      totalRegistros: data.length,
      totalFaturado: data.reduce((a, r) => a + r.faturado, 0),
      totalPago: data.reduce((a, r) => a + r.pago, 0),
      totalPendente: data.reduce((a, r) => a + r.pendente, 0),
      data,
    });
  }
  if (method === 'GET' && path === '/reports/fleet/maintenance-costs') {
    return ok({
      periodo: { from: params.get('from') ?? daysAgo(30), to: params.get('to') ?? daysAgo(0) },
      total: 4200,
      manutencoes: 9,
      veiculos: [
        { vehicleId: 'v3', placa: 'JKL9A81', modelo: 'Compass', categoria: 'SUV', total: 1600, qtd: 3, ultimaData: `${daysAgo(5)}T12:00:00Z` },
        { vehicleId: 'v1', placa: 'ABC1D23', modelo: 'Onix LT', categoria: 'ECONOMICO', total: 980, qtd: 2, ultimaData: `${daysAgo(12)}T12:00:00Z` },
        { vehicleId: 'v8', placa: 'QWE4T67', modelo: 'Hilux SW4', categoria: 'UTILITARIO', total: 830, qtd: 2, ultimaData: `${daysAgo(9)}T12:00:00Z` },
      ],
    });
  }
  if (method === 'GET' && path === '/reports/stock/cost-analysis') {
    return ok({
      periodo: { from: params.get('from') ?? daysAgo(30), to: params.get('to') ?? daysAgo(0) },
      custoTotal: 1980,
      itens: 48,
      produtos: [
        { productId: 'p1', nome: 'Shampoo Automotivo', unidade: 'L', quantidade: 22.5, custoTotal: 900 },
        { productId: 'p2', nome: 'Cera Líquida', unidade: 'L', quantidade: 8.4, custoTotal: 630 },
        { productId: 'p3', nome: 'Desengraxante', unidade: 'L', quantidade: 12.0, custoTotal: 450 },
      ],
    });
  }

  // ── Users ─────────────────────────────────────────────────────────────────────────────────
  if (method === 'GET'  && path === '/users') return ok(MOCK_USERS_LIST);
  if (method === 'POST' && path === '/users') { const u = { ...(req.body as object), id: `u-${Date.now()}`, ativo: true, createdAt: new Date().toISOString() }; MOCK_USERS_LIST.push(u as never); return ok(u); }
  if (method === 'PUT'    && path.match(/\/users\/.+/)) return ok({ ...MOCK_USERS_LIST[0], ...(req.body as object) });
  if (method === 'PATCH'  && path.match(/\/users\/.+/)) return ok({ ...MOCK_USERS_LIST[0], ...(req.body as object) });
  if (method === 'DELETE' && path.match(/\/users\/.+/)) return ok({});

  // ── Customers ─────────────────────────────────────────────────────────────────────────────
  if (method === 'GET' && path.match(/\/customers\/[^/]+\/history/)) {
    const id = path.split('/customers/')[1].replace('/history', '');
    const c  = MOCK_CUSTOMERS.find(x => x.id === id) ?? MOCK_CUSTOMERS[0];
    return ok({ customer: c, schedules: mockSchedules.filter(s => s['customerId'] === id), contracts: mockContracts.filter(c2 => c2['customerId'] === id) });
  }
  if (method === 'GET' && path.match(/\/customers\/[^/]+$/)) { const id = path.split('/customers/')[1]; return ok(MOCK_CUSTOMERS.find(x => x.id === id) ?? MOCK_CUSTOMERS[0]); }
  if (method === 'GET' && path.startsWith('/customers')) {
    const q = params.get('q')?.toLowerCase();
    const filtered = q ? MOCK_CUSTOMERS.filter(c => c.nome.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)) : MOCK_CUSTOMERS;
    return ok(paginated(filtered, Number(params.get('page') ?? 1)));
  }
  if (method === 'POST'   && path.startsWith('/customers')) return ok({ ...(req.body as object), id: `c-${Date.now()}`, ativo: true, createdAt: new Date().toISOString() });
  if (method === 'PUT'    && path.match(/\/customers\/.+/)) return ok({ ...MOCK_CUSTOMERS[0], ...(req.body as object) });
  if (method === 'PATCH'  && path.match(/\/customers\/.+/)) return ok({ ...MOCK_CUSTOMERS[0], ...(req.body as object) });
  if (method === 'DELETE' && path.match(/\/customers\/.+/)) return ok({});

  // ── Fleet ─────────────────────────────────────────────────────────────────────────────────
  if (method === 'GET' && path.match(/\/fleet\/[^/]+$/)) {
    const id = path.split('/fleet/')[1];
    const vehicle = MOCK_VEHICLES.find(x => x.id === id) ?? MOCK_VEHICLES[0];
    return ok({
      ...vehicle,
      maintenances: [...mockMaintenances].filter(m => m['vehicleId'] === vehicle.id).sort((a, b) => (b['data'] as string).localeCompare(a['data'] as string)),
      contracts: mockContracts.filter(c => c['vehicleId'] === id),
    });
  }
  // Fleet maintenance endpoints
  if (method === 'GET' && path.match(/\/fleet\/[^/]+\/maintenances/)) {
    const id = path.split('/fleet/')[1].replace('/maintenances', '');
    return ok([...mockMaintenances].filter(m => m['vehicleId'] === id).sort((a, b) => (b['data'] as string).localeCompare(a['data'] as string)));
  }
  if (method === 'POST' && path.match(/\/fleet\/[^/]+\/maintenances/)) {
    const id   = path.split('/fleet/')[1].replace('/maintenances', '');
    const body = req.body as Record<string, unknown>;
    const entry = { ...body, id: `mt-${Date.now()}`, vehicleId: id, createdAt: new Date().toISOString() };
    mockMaintenances.push(entry);
    if (body['setMantencao']) {
      const v = MOCK_VEHICLES.find(x => x.id === id);
      if (v) v.status = 'MANUTENCAO' as const;
    }
    return ok(entry);
  }
  if (method === 'PATCH' && path.match(/\/fleet\/[^/]+\/complete-maintenance/)) {
    const id = path.split('/fleet/')[1].replace('/complete-maintenance', '');
    const v  = MOCK_VEHICLES.find(x => x.id === id);
    if (v) v.status = 'DISPONIVEL' as const;
    return ok(v ?? {});
  }
  if (method === 'GET' && path.startsWith('/fleet')) {
    const status = params.get('status'); const cat = params.get('categoria');
    let list = [...MOCK_VEHICLES];
    if (status) list = list.filter(v => v.status === status);
    if (cat)    list = list.filter(v => v.categoria === cat);
    return ok(paginated(list, Number(params.get('page') ?? 1)));
  }
  if (method === 'POST'   && path.startsWith('/fleet'))    return ok({ ...(req.body as object), id: `v-${Date.now()}`, fotos: [], createdAt: new Date().toISOString() });
  if (method === 'PATCH'  && path.match(/\/fleet\/.+/)) return ok({ ...MOCK_VEHICLES[0], ...(req.body as object) });
  if (method === 'PUT'    && path.match(/\/fleet\/.+/)) return ok({ ...MOCK_VEHICLES[0], ...(req.body as object) });
  if (method === 'DELETE' && path.match(/\/fleet\/.+/)) return ok({});

  // ── Inventory ─────────────────────────────────────────────────────────────────────────────
  if (method === 'GET' && path.startsWith('/inventory/products')) {
    const idMatch = path.match(/\/inventory\/products\/([^?]+)/);
    if (idMatch) return ok(MOCK_PRODUCTS.find(p => p.id === idMatch[1]) ?? MOCK_PRODUCTS[0]);
    return ok(paginated(MOCK_PRODUCTS));
  }
  if (method === 'POST'   && path.startsWith('/inventory/products')) return ok({ ...(req.body as object), id: `p-${Date.now()}`, ativo: true, createdAt: new Date().toISOString() });
  if (method === 'PATCH'  && path.match(/\/inventory\/products\/.+/)) return ok({ ...MOCK_PRODUCTS[0], ...(req.body as object) });
  if (method === 'PUT'    && path.match(/\/inventory\/products\/.+/)) return ok({ ...MOCK_PRODUCTS[0], ...(req.body as object) });
  if (method === 'DELETE' && path.match(/\/inventory\/products\/.+/)) return ok({});
  if (method === 'GET' && path.startsWith('/inventory/movements')) {
    const pid = params.get('productId');
    const list = pid ? MOCK_STOCK_MOVEMENTS.filter(m => m['productId'] === pid) : MOCK_STOCK_MOVEMENTS;
    return ok(paginated([...list].reverse()));
  }
  if (method === 'POST' && path.startsWith('/inventory/movements')) {
    const body = req.body as Record<string, unknown>;
    const product = MOCK_PRODUCTS.find(p => p.id === body['productId']);
    const mv = { ...body, id: `sm-${Date.now()}`, createdAt: new Date().toISOString(), product: product ? { nome: product.nome, unidade: product.unidade } : undefined };
    MOCK_STOCK_MOVEMENTS.push(mv as never);
    return ok(mv);
  }

  // ── Wash services ─────────────────────────────────────────────────────────────────────────────
  if (method === 'GET'    && path.startsWith('/wash/services'))          return ok(paginated(MOCK_WASH_SERVICES));
  if (method === 'POST'   && path.startsWith('/wash/services'))          return ok({ ...(req.body as object), id: `ws-${Date.now()}`, ativo: true, createdAt: new Date().toISOString() });
  if (method === 'PATCH'  && path.match(/\/wash\/services\/.+/))     return ok({ ...MOCK_WASH_SERVICES[0], ...(req.body as object) });
  if (method === 'PUT'    && path.match(/\/wash\/services\/.+/))     return ok({ ...MOCK_WASH_SERVICES[0], ...(req.body as object) });
  if (method === 'DELETE' && path.match(/\/wash\/services\/.+/))     return ok({});

  // ── Lavajato queue ────────────────────────────────────────────────────────────────────────────
  if (method === 'GET' && path.startsWith('/lavajato/queue') && !path.includes('/advance') && !path.includes('/payment') && !path.includes('/stream')) return ok(mockQueue);
  if (method === 'POST' && path.match(/\/lavajato\/queue\/[^/]+\/payment/)) return ok({ message: 'Pagamento registrado (mock).' });
  if (method === 'PATCH' && path.match(/\/lavajato\/queue\/[^/]+\/advance/)) {
    const id = path.split('/lavajato/queue/')[1].replace('/advance', '');
    const ORDER = ['AGUARDANDO', 'EM_ATENDIMENTO', 'CONCLUIDO'];
    const item = mockQueue.find(q => q['id'] === id);
    if (item) { const idx = ORDER.indexOf(item['status'] as string); if (idx < ORDER.length - 1) { item['status'] = ORDER[idx + 1]; if (item['status'] === 'CONCLUIDO') item['concluidoAt'] = new Date().toISOString(); } }
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

  // ── Lavajato schedules ───────────────────────────────────────────────────────────────────────
  // availability must come before the general schedules GET so the more specific route matches first
  if (method === 'GET' && path === '/lavajato/schedules/availability') {
    const date      = params.get('date') ?? TODAY;
    const serviceId = params.get('serviceId') ?? undefined;
    const svc       = serviceId ? MOCK_WASH_SERVICES.find(s => s.id === serviceId) : undefined;
    const duration  = svc?.duracaoMin ?? 30;
    const OPEN = 8, CLOSE = 18;
    const existing = mockSchedules.filter(s =>
      (s['dataHora'] as string).startsWith(date) && s['status'] !== 'CANCELADO'
    );
    const slots: { time: string; dateTime: string; available: boolean }[] = [];
    for (let m = 0; m < (CLOSE - OPEN) * 60; m += duration) {
      const absMin = OPEN * 60 + m;
      const hh = String(Math.floor(absMin / 60)).padStart(2, '0');
      const mm = String(absMin % 60).padStart(2, '0');
      const time = `${hh}:${mm}`;
      const slotStart = new Date(`${date}T${time}:00`).getTime();
      const slotEnd   = slotStart + duration * 60_000;
      const conflict  = existing.find(s => {
        const svcDur = (MOCK_WASH_SERVICES.find(ws => ws.id === s['serviceId'])?.duracaoMin ?? 30);
        const sStart = new Date(s['dataHora'] as string).getTime();
        const sEnd   = sStart + svcDur * 60_000;
        return slotStart < sEnd && slotEnd > sStart;
      });
      slots.push({ time, dateTime: new Date(slotStart).toISOString(), available: !conflict });
    }
    return ok({ date, serviceId, duration, slots });
  }
  if (method === 'GET' && path.startsWith('/lavajato/schedules') && !path.match(/\/schedules\/.+/)) {
    const date  = params.get('date');
    const month = params.get('month');
    if (date)  return ok(mockSchedules.filter(s => (s['dataHora'] as string).startsWith(date)));
    if (month) return ok(mockSchedules.filter(s => (s['dataHora'] as string).startsWith(month)));
    return ok(mockSchedules);
  }
  if (method === 'POST'  && path.match(/\/lavajato\/schedules\/[^/]+\/payment/)) return ok({ message: 'Pagamento registrado (mock).' });
  if (method === 'PATCH' && path.match(/\/lavajato\/schedules\/[^/]+\/status/)) {
    const id = path.split('/lavajato/schedules/')[1].replace('/status', '');
    const body = req.body as Record<string, unknown>;
    const item = mockSchedules.find(s => s['id'] === id);
    if (item) item['status'] = body['status'];
    return ok(item ?? {});
  }
  if (method === 'DELETE' && path.match(/\/lavajato\/schedules\/[^/]+/)) {
    const id = path.split('/lavajato/schedules/')[1];
    const item = mockSchedules.find(s => s['id'] === id);
    if (item) item['status'] = 'CANCELADO';
    return ok(item ?? {});
  }
  if (method === 'POST' && path.startsWith('/lavajato/schedules')) {
    const body  = req.body as Record<string, unknown>;
    const svc   = MOCK_WASH_SERVICES.find(s => s.id === body['serviceId']);
    const entry = { ...body, id: `sch-${Date.now()}`, status: 'AGENDADO', service: svc };
    mockSchedules.push(entry);
    return ok(entry);
  }

  // ── Lavajato atendimentos ────────────────────────────────────────────────────────────────────────
  if (method === 'GET' && path.startsWith('/lavajato/atendimentos')) return ok({ schedules: mockSchedules, queues: mockQueue });

  // ── Portal cliente ───────────────────────────────────────────────────────────────────────────
  if (method === 'GET'  && path === '/portal/my-schedules') return ok(mockSchedules.filter(s => s['customerId'] === CLIENT_CUSTOMER_ID));
  if (method === 'POST' && path === '/portal/my-schedules') {
    const body  = req.body as Record<string, unknown>;
    const svc   = MOCK_WASH_SERVICES.find(s => s.id === body['serviceId']);
    const entry = { ...body, id: `sch-${Date.now()}`, customerId: CLIENT_CUSTOMER_ID, status: 'AGENDADO', service: svc, customer: { id: 'c1', nome: 'Carlos Andrade', telefone: '(11) 91234-5678' } };
    mockSchedules.push(entry);
    return ok(entry);
  }
  if (method === 'GET'  && path === '/portal/my-contracts') return ok(paginated(mockContracts.filter(c => c['customerId'] === CLIENT_CUSTOMER_ID)));
  if (method === 'POST' && path === '/portal/my-contracts') {
    const body    = req.body as Record<string, unknown>;
    const vehicle = MOCK_VEHICLES.find(v => v.id === body['vehicleId']);
    const ret = new Date(body['dataRetirada'] as string); const dev = new Date(body['dataDevolucao'] as string);
    const days = Math.max(1, Math.round((dev.getTime() - ret.getTime()) / 86400000));
    const diaria = vehicle?.diariaPadrao ?? 100;
    const total  = diaria * days * (body['seguro'] ? 1.1 : 1);
    const entry  = { ...body, id: `rc-${Date.now()}`, customerId: CLIENT_CUSTOMER_ID, status: 'RESERVADO', valorDiaria: diaria, valorTotal: Math.round(total), valorSeguro: body['seguro'] ? Math.round(diaria * days * 0.1) : undefined, createdAt: new Date().toISOString(), customer: { id: 'c1', nome: 'Carlos Andrade', cpfCnpj: '123.456.789-00' }, vehicle: vehicle ? { id: vehicle.id, placa: vehicle.placa, modelo: vehicle.modelo, kmAtual: vehicle.kmAtual } : undefined };
    mockContracts.push(entry);
    return ok(entry);
  }
  if (method === 'GET' && path === '/portal/available-vehicles') return ok(paginated(MOCK_VEHICLES.filter(v => v.status === 'DISPONIVEL')));

  // ── Rental contracts ────────────────────────────────────────────────────────────────────────────
  if (method === 'GET' && path.match(/\/rental\/contracts\/[^/]+$/)) { const id = path.split('/rental/contracts/')[1]; return ok(mockContracts.find(c => c['id'] === id) ?? { ...mockContracts[0], inspections: [], payments: [] }); }
  if (method === 'PATCH' && path.match(/\/rental\/contracts\/[^/]+\/close/))   { const id = path.split('/')[3]; const c = mockContracts.find(x => x['id'] === id); if (c) c['status'] = 'ENCERRADO';  return ok(c ?? {}); }
  if (method === 'PATCH' && path.match(/\/rental\/contracts\/[^/]+\/open/))    { const id = path.split('/')[3]; const c = mockContracts.find(x => x['id'] === id); if (c) c['status'] = 'ATIVO';      return ok(c ?? {}); }
  if (method === 'PATCH' && path.match(/\/rental\/contracts\/[^/]+\/cancel/))  { const id = path.split('/')[3]; const c = mockContracts.find(x => x['id'] === id); if (c) c['status'] = 'CANCELADO'; return ok(c ?? {}); }
  if (method === 'GET' && path.startsWith('/rental/contracts')) {
    const status = params.get('status');
    return ok(paginated(status ? mockContracts.filter(c => c['status'] === status) : mockContracts, Number(params.get('page') ?? 1)));
  }
  if (method === 'POST'  && path.match(/\/rental\/contracts\/[^/]+\/payment/)) return ok({ message: 'Pagamento registrado (mock).' });
  if (method === 'POST'  && path.startsWith('/rental/contracts')) { const entry = { ...(req.body as object), id: `rc-${Date.now()}`, status: 'RESERVADO', createdAt: new Date().toISOString() }; mockContracts.push(entry); return ok(entry); }
  if (method === 'PUT' && path.match(/\/rental\/contracts\/.+/)) return ok({ ...mockContracts[0], ...(req.body as object) });

  // ── Rental availability ──────────────────────────────────────────────────────────────────────────
  if (method === 'GET' && path.startsWith('/rental/available')) return ok(MOCK_VEHICLES.filter(v => v.status === 'DISPONIVEL'));

  // ── Templates ─────────────────────────────────────────────────────────────────────────────────
  if (method === 'GET'    && path.startsWith('/templates')) return ok(MOCK_TEMPLATES);
  if (method === 'POST'   && path.startsWith('/templates')) return ok({ ...(req.body as object), id: `t-${Date.now()}`, ativo: true, createdAt: new Date().toISOString() });
  if (method === 'PUT'    && path.match(/\/templates\/.+/)) return ok({ ...MOCK_TEMPLATES[0], ...(req.body as object) });
  if (method === 'PATCH'  && path.match(/\/templates\/.+/)) return ok({ ...MOCK_TEMPLATES[0], ...(req.body as object) });
  if (method === 'DELETE' && path.match(/\/templates\/.+/)) return ok({});

  // ── Health ────────────────────────────────────────────────────────────────────────────
  if (method === 'GET' && path.startsWith('/health')) return ok({ status: 'ok', timestamp: new Date().toISOString() });

  return next(req);
};
