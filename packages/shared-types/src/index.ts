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
export type TemplateType = 'CONTRATO_LOCACAO' | 'RECIBO_LAVAGEM' | 'RECIBO_LOCACAO';

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

// ─── Pagination ──────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

