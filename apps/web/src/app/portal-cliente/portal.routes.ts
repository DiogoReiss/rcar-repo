import { Routes } from '@angular/router';

export const portalRoutes: Routes = [
  { path: 'meus-agendamentos', loadComponent: () => import('./meus-agendamentos/meus-agendamentos') },
  { path: 'minhas-reservas', loadComponent: () => import('./minhas-reservas/minhas-reservas') },
  { path: 'meus-documentos', loadComponent: () => import('./meus-documentos/meus-documentos') },
  { path: 'meus-pagamentos', loadComponent: () => import('./meus-pagamentos/meus-pagamentos') },
  { path: 'historico', loadComponent: () => import('./historico/historico') },
  { path: '', redirectTo: 'meus-agendamentos', pathMatch: 'full' },
];

