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

