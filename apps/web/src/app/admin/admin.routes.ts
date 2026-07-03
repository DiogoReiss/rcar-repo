import { Routes } from '@angular/router';
import { featureGuard } from '@core/auth/guards/feature.guard';

export const adminRoutes: Routes = [
  { path: '', loadComponent: () => import('./dashboard/dashboard'), pathMatch: 'full' },

  { path: 'usuarios', canActivate: [featureGuard('ADMIN_USUARIOS')], loadComponent: () => import('./usuarios/usuarios-list/usuarios-list') },
  { path: 'servicos', canActivate: [featureGuard('ADMIN_SERVICOS')], loadComponent: () => import('./servicos/servicos-list/servicos-list') },
  { path: 'estoque', canActivate: [featureGuard('ADMIN_ESTOQUE')], loadComponent: () => import('./estoque/produtos-list/produtos-list') },
  { path: 'estoque/movimentacoes', canActivate: [featureGuard('ADMIN_ESTOQUE')], loadComponent: () => import('./estoque/movimentacoes/movimentacoes') },
  { path: 'frota', canActivate: [featureGuard('ADMIN_FROTA')], loadComponent: () => import('./frota/frota-list/frota-list') },
  { path: 'frota/:id', canActivate: [featureGuard('ADMIN_FROTA')], loadComponent: () => import('./frota/veiculo-detail/veiculo-detail') },
  { path: 'clientes', canActivate: [featureGuard('ADMIN_CLIENTES')], loadComponent: () => import('./clientes/clientes-list/clientes-list') },
  { path: 'clientes/:id', canActivate: [featureGuard('ADMIN_CLIENTES')], loadComponent: () => import('./clientes/cliente-detail/cliente-detail') },
  { path: 'templates', canActivate: [featureGuard('ADMIN_TEMPLATES')], loadComponent: () => import('./templates/templates-list/templates-list') },
  { path: 'financeiro', canActivate: [featureGuard('ADMIN_FINANCEIRO')], loadComponent: () => import('./financeiro/financeiro-dashboard/financeiro-dashboard') },
];
