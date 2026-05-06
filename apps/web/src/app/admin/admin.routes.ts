import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  { path: '', loadComponent: () => import('./dashboard/dashboard'), pathMatch: 'full' },

  // Usuarios
  { path: 'usuarios', loadComponent: () => import('./usuarios/usuarios-list/usuarios-list') },
  { path: 'usuarios/novo', loadComponent: () => import('./usuarios/usuario-form/usuario-form') },
  { path: 'usuarios/:id/editar', loadComponent: () => import('./usuarios/usuario-form/usuario-form') },

  // Servicos
  { path: 'servicos', loadComponent: () => import('./servicos/servicos-list/servicos-list') },
  { path: 'servicos/novo', loadComponent: () => import('./servicos/servico-form/servico-form') },
  { path: 'servicos/:id/editar', loadComponent: () => import('./servicos/servico-form/servico-form') },

  // Estoque
  { path: 'estoque', loadComponent: () => import('./estoque/produtos-list/produtos-list') },
  { path: 'estoque/novo', loadComponent: () => import('./estoque/produto-form/produto-form') },
  { path: 'estoque/:id/editar', loadComponent: () => import('./estoque/produto-form/produto-form') },
  { path: 'estoque/movimentacoes', loadComponent: () => import('./estoque/movimentacoes/movimentacoes') },

  // Frota
  { path: 'frota', loadComponent: () => import('./frota/frota-list/frota-list') },
  { path: 'frota/novo', loadComponent: () => import('./frota/veiculo-form/veiculo-form') },
  { path: 'frota/:id/editar', loadComponent: () => import('./frota/veiculo-form/veiculo-form') },

  // Clientes
  { path: 'clientes', loadComponent: () => import('./clientes/clientes-list/clientes-list') },
  { path: 'clientes/novo', loadComponent: () => import('./clientes/cliente-form/cliente-form') },
  { path: 'clientes/:id/editar', loadComponent: () => import('./clientes/cliente-form/cliente-form') },

  // Templates
  { path: 'templates', loadComponent: () => import('./templates/templates-list/templates-list') },
];
