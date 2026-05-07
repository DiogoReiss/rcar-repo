import { Routes } from '@angular/router';

export const aluguelRoutes: Routes = [
  { path: 'reserva', redirectTo: 'contratos', pathMatch: 'full' },
  { path: 'contratos', loadComponent: () => import('./contratos/contrato-list/contrato-list') },
  { path: 'contratos/:id', loadComponent: () => import('./contratos/contrato-detail/contrato-detail') },
  { path: 'devolucao/:id', loadComponent: () => import('./devolucao/vistoria-chegada/vistoria-chegada') },
  { path: '', redirectTo: 'contratos', pathMatch: 'full' },
];
