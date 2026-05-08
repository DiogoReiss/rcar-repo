/**
 * @rcar/shared-types
 *
 * Single source of truth for all domain types shared between the API and the web app.
 * API Prisma models and frontend Angular models should both align with these definitions.
 *
 * ─── Usage ────────────────────────────────────────────────────────────────────
 * API:   import type { UserDto } from '@rcar/shared-types';
 * Web:   import type { User } from '@rcar/shared-types';
 */

// ─── Enums ──────────────────────────────────────────────────────────────────

export type UserRole = 'GESTOR_GERAL' | 'OPERADOR' | 'CLIENTE';
export type CustomerType = 'PF' | 'PJ';
export type VehicleStatus = 'DISPONIVEL' | 'ALUGADO' | 'MANUTENCAO' | 'INATIVO';
export type VehicleCategory = 'ECONOMICO' | 'INTERMEDIARIO' | 'SUV' | 'EXECUTIVO' | 'UTILITARIO';
export type WashScheduleStatus = 'AGENDADO' | 'EM_ATENDIMENTO' | 'CONCLUIDO' | 'CANCELADO';
export type WashQueueStatus = 'AGUARDANDO' | 'EM_ATENDIMENTO' | 'CONCLUIDO';
export type RentalModality = 'DIARIA' | 'SEMANAL' | 'MENSAL';
export type ContractStatus = 'RESERVADO' | 'ATIVO' | 'ENCERRADO' | 'CANCELADO';
export type PaymentMethod = 'DINHEIRO' | 'PIX' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO';
export type PaymentStatus = 'PENDENTE' | 'CONFIRMADO' | 'CANCELADO';
export type PaymentRefType = 'WASH_SCHEDULE' | 'WASH_QUEUE' | 'RENTAL_CONTRACT';
export type StockMovementType = 'ENTRADA' | 'SAIDA' | 'AJUSTE';
export type InspectionType = 'SAIDA' | 'CHEGADA';
export type TemplateType = 'CONTRATO_LOCACAO' | 'RECIBO_LAVAGEM' | 'RECIBO_LOCACAO' | 'VISTORIA';
export type MaintenanceType = 'PREVENTIVA' | 'CORRETIVA' | 'SINISTRO';
export type MaintenanceStatus = 'PENDENTE' | 'CONCLUIDA';

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  senha: string;
}

// ─── Users ───────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  ativo: boolean;
  createdAt: string;
  updatedAt?: string;
}

// ─── Customers ───────────────────────────────────────────────────────────────

export interface Customer {
  id: string;
  tipo: CustomerType;
  nome: string;
  cpfCnpj: string;
  email?: string;
  telefone?: string;
  endereco?: Record<string, unknown>;
  // PF
  cnh?: string;
  cnhValidade?: string;
  cnhUrl?: string;
  // PJ
  razaoSocial?: string;
  inscEstadual?: string;
  responsavel?: string;
  ativo: boolean;
  createdAt: string;
  updatedAt?: string;
}

// ─── Fleet ───────────────────────────────────────────────────────────────────

export interface VehicleMaintenance {
  id: string;
  vehicleId: string;
  descricao: string;
  custo: number;
  tipo?: MaintenanceType;
  status?: MaintenanceStatus;
  fornecedor?: string;
  data: string;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  placa: string;
  modelo: string;
  ano: number;
  cor: string;
  categoria: VehicleCategory;
  status: VehicleStatus;
  fotos: string[];
  kmAtual: number;
  createdAt: string;
  updatedAt?: string;
}

// ─── Wash ────────────────────────────────────────────────────────────────────

export interface WashService {
  id: string;
  nome: string;
  descricao?: string;
  preco: number;
  duracaoMin: number;
  ativo: boolean;
  createdAt: string;
}

export interface WashSchedule {
  id: string;
  customerId?: string;
  nomeAvulso?: string;
  telefone?: string;
  serviceId: string;
  dataHora: string;
  status: WashScheduleStatus;
  observacoes?: string;
  service?: WashService;
  customer?: Pick<Customer, 'id' | 'nome' | 'telefone'>;
}

export interface WashQueueEntry {
  id: string;
  customerId?: string;
  nomeAvulso?: string;
  serviceId: string;
  veiculoPlaca?: string;
  status: WashQueueStatus;
  posicao: number;
  createdAt: string;
  concluidoAt?: string;
  service?: WashService;
  customer?: Pick<Customer, 'id' | 'nome'>;
}

// ─── Inventory ───────────────────────────────────────────────────────────────

export interface Product {
  id: string;
  nome: string;
  descricao?: string;
  unidade: string;
  quantidadeAtual: number;
  estoqueMinimo: number;
  custoUnitario?: number;
  ativo: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  tipo: StockMovementType;
  quantidade: number;
  custoUnitario?: number;
  motivo?: string;
  userId?: string;
  createdAt: string;
  product?: Pick<Product, 'nome' | 'unidade'>;
}

// ─── Rental ──────────────────────────────────────────────────────────────────

export interface RentalContract {
  id: string;
  customerId: string;
  vehicleId: string;
  modalidade: RentalModality;
  dataRetirada: string;
  dataDevolucao: string;
  dataDevReal?: string;
  valorDiaria: number;
  valorTotal: number;
  valorTotalReal?: number;
  seguro: boolean;
  valorSeguro?: number;
  status: ContractStatus;
  kmRetirada?: number;
  kmDevolucao?: number;
  kmLimite?: number;
  combustivelSaida?: string;
  combustivelChegada?: string;
  observacoes?: string;
  pdfUrl?: string;
  d4signId?: string;
  d4signStatus?: string;
  createdAt: string;
  updatedAt?: string;
  customer?: Pick<Customer, 'id' | 'nome' | 'cpfCnpj'>;
  vehicle?: Pick<Vehicle, 'id' | 'placa' | 'modelo' | 'kmAtual'>;
  inspections?: Inspection[];
  payments?: Payment[];
}

export interface Inspection {
  id: string;
  contractId: string;
  tipo: InspectionType;
  checklist: Record<string, unknown>;
  fotos: string[];
  observacoes?: string;
  createdAt: string;
}

// ─── Payments ────────────────────────────────────────────────────────────────

export interface Payment {
  id: string;
  refType: PaymentRefType;
  scheduleId?: string;
  queueId?: string;
  contractId?: string;
  customerId?: string;
  valor: number;
  metodo: PaymentMethod;
  status: PaymentStatus;
  observacoes?: string;
  createdAt: string;
}

// ─── Templates ───────────────────────────────────────────────────────────────

export interface Template {
  id: string;
  nome: string;
  tipo: TemplateType;
  conteudoHtml: string;
  variaveis: string[];
  ativo: boolean;
  createdAt: string;
  updatedAt?: string;
}

// ─── Availability ────────────────────────────────────────────────────────────

export interface AvailabilitySlot {
  time: string;       // 'HH:MM'
  dateTime: string;   // ISO string
  available: boolean;
  conflictsWith?: string;
}

export interface AvailabilityResponse {
  date: string;
  serviceId?: string;
  duration: number; // minutes
  slots: AvailabilitySlot[];
}

// ─── Financial Reports ──────────────────────────────────────────────────────

export interface FinancialSummary {
  periodo: { from: string; to: string };
  receita: {
    lavajato: number;
    aluguel: number;
    extrasAluguel: number;
    total: number;
  };
  custos: {
    insumos: number;
    manutencao: number;
    total: number;
  };
  margem: {
    bruta: number;
    percentual: number;
  };
}

export interface RentalReceivableRow {
  contractId: string;
  customer?: Pick<Customer, 'id' | 'nome' | 'cpfCnpj'>;
  vehicle?: Pick<Vehicle, 'id' | 'placa' | 'modelo'>;
  dataDevReal?: string | Date | null;
  dueDate?: string | Date | null;
  overdue?: boolean;
  faturado: number;
  pago: number;
  pendente: number;
  payments: Array<Pick<Payment, 'id' | 'valor' | 'metodo' | 'createdAt'>>;
}

export interface RentalReceivablesReport {
  totalRegistros: number;
  totalFaturado: number;
  totalPago: number;
  totalPendente: number;
  aging: {
    vencidos: number;
    aVencer: number;
  };
  data: RentalReceivableRow[];
}

export interface MaintenanceCostsReport {
  periodo: { from: string; to: string };
  totalCusto: number;
  totalReceita: number;
  totalLucroBruto: number;
  manutencoes: number;
  veiculos: Array<{
    vehicleId: string;
    placa: string;
    modelo: string;
    categoria: string;
    custo: number;
    receita: number;
    lucroBruto: number;
    qtd: number;
    ultimaData: string;
  }>;
}

export interface StockCostAnalysisReport {
  periodo: { from: string; to: string };
  custoTotal: number;
  itens: number;
  valorEstoqueAtual: number;
  produtos: Array<{
    productId: string;
    nome: string;
    unidade: string;
    quantidade: number;
    custoTotal: number;
  }>;
}

export interface PaymentMethodSummaryReport {
  totalValor: number;
  totalQuantidade: number;
  data: Array<{
    metodo: PaymentMethod;
    quantidade: number;
    valor: number;
    percentual: number;
  }>;
}

// ─── Pagination ──────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

