import { Routes } from '@angular/router';

export const aluguelRoutes: Routes = [
  { path: 'reserva', loadComponent: () => import('./reserva/disponibilidade/disponibilidade') },
  { path: 'contratos', loadComponent: () => import('./contratos/contrato-list/contrato-list') },
  { path: 'contratos/:id', loadComponent: () => import('./contratos/contrato-detail/contrato-detail') },
  { path: 'devolucao/:id', loadComponent: () => import('./devolucao/vistoria-chegada/vistoria-chegada') },
  { path: '', redirectTo: 'reserva', pathMatch: 'full' },
];
