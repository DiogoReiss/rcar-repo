export interface User {
  id: string;
  nome: string;
  email: string;
  role: 'GESTOR_GERAL' | 'OPERADOR' | 'CLIENTE';
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CustomerType = 'PF' | 'PJ';

export interface Customer {
  id: string;
  tipo: CustomerType;
  nome: string;
  cpfCnpj: string;
  email?: string;
  telefone?: string;
  cnh?: string;
  cnhValidade?: string;
  razaoSocial?: string;
  responsavel?: string;
  ativo: boolean;
  createdAt: string;
}

export type VehicleStatus = 'DISPONIVEL' | 'ALUGADO' | 'MANUTENCAO' | 'INATIVO';
export type VehicleCategory = 'ECONOMICO' | 'INTERMEDIARIO' | 'SUV' | 'EXECUTIVO' | 'UTILITARIO';

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
}

export interface WashService {
  id: string;
  nome: string;
  descricao?: string;
  preco: number;
  duracaoMin: number;
  ativo: boolean;
  createdAt: string;
}

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
}

export interface StockMovement {
  id: string;
  productId: string;
  tipo: 'ENTRADA' | 'SAIDA' | 'AJUSTE';
  quantidade: number;
  motivo?: string;
  createdAt: string;
  product?: { nome: string; unidade: string };
}

export type WashScheduleStatus = 'AGENDADO' | 'EM_ATENDIMENTO' | 'CONCLUIDO' | 'CANCELADO';
export type WashQueueStatus = 'AGUARDANDO' | 'EM_ATENDIMENTO' | 'CONCLUIDO';
export type PaymentMethod = 'DINHEIRO' | 'PIX' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO';

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
  customer?: { id: string; nome: string; telefone?: string };
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
  customer?: { id: string; nome: string };
}

