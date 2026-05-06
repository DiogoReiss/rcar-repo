export type UserRole = 'GESTOR_GERAL' | 'OPERADOR' | 'CLIENTE';

export interface User {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  ativo: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  senha: string;
}
