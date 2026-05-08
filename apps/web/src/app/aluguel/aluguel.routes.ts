import { Routes } from '@angular/router';

export const aluguelRoutes: Routes = [
  { path: 'reserva', redirectTo: 'contratos', pathMatch: 'full' },
  { path: 'contratos', loadComponent: () => import('./contratos/contrato-list/contrato-list') },
  { path: 'contratos/:id', redirectTo: 'contratos', pathMatch: 'full' },
  { path: 'devolucao/:id', redirectTo: 'contratos', pathMatch: 'full' },
  { path: '', redirectTo: 'contratos', pathMatch: 'full' },
];
