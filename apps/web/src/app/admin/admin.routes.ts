import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  { path: '', loadComponent: () => import('./dashboard/dashboard'), pathMatch: 'full' },
  { path: 'usuarios', loadComponent: () => import('./usuarios/usuarios-list/usuarios-list') },
  { path: 'servicos', loadComponent: () => import('./servicos/servicos-list/servicos-list') },
  { path: 'estoque', loadComponent: () => import('./estoque/produtos-list/produtos-list') },
  { path: 'estoque/novo', loadComponent: () => import('./estoque/produto-form/produto-form') },
  { path: 'estoque/:id/editar', loadComponent: () => import('./estoque/produto-form/produto-form') },
  { path: 'estoque/movimentacoes', loadComponent: () => import('./estoque/movimentacoes/movimentacoes') },
  { path: 'frota', loadComponent: () => import('./frota/frota-list/frota-list') },
  { path: 'clientes', loadComponent: () => import('./clientes/clientes-list/clientes-list') },
  { path: 'templates', loadComponent: () => import('./templates/templates-list/templates-list') },
];

