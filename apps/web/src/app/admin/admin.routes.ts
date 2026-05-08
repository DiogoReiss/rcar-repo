import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  { path: '', loadComponent: () => import('./dashboard/dashboard'), pathMatch: 'full' },

  { path: 'usuarios',  loadComponent: () => import('./usuarios/usuarios-list/usuarios-list') },
  { path: 'servicos',  loadComponent: () => import('./servicos/servicos-list/servicos-list') },
  { path: 'estoque',   loadComponent: () => import('./estoque/produtos-list/produtos-list') },
  { path: 'estoque/movimentacoes', loadComponent: () => import('./estoque/movimentacoes/movimentacoes') },
  { path: 'frota',     loadComponent: () => import('./frota/frota-list/frota-list') },
  { path: 'frota/:id', loadComponent: () => import('./frota/veiculo-detail/veiculo-detail') },
  { path: 'clientes',  loadComponent: () => import('./clientes/clientes-list/clientes-list') },
  { path: 'clientes/:id', loadComponent: () => import('./clientes/cliente-detail/cliente-detail') },
  { path: 'templates', loadComponent: () => import('./templates/templates-list/templates-list') },
  { path: 'financeiro', loadComponent: () => import('./financeiro/financeiro-dashboard/financeiro-dashboard') },
];
