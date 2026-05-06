import { Routes } from '@angular/router';

export const lavajatoRoutes: Routes = [
  { path: 'agendamento', loadComponent: () => import('./agendamento/calendario/calendario') },
  { path: 'fila', loadComponent: () => import('./fila/fila-painel/fila-painel') },
  { path: 'fila/adicionar', loadComponent: () => import('./fila/fila-adicionar/fila-adicionar') },
  { path: 'atendimentos', loadComponent: () => import('./atendimentos/atendimentos-dia/atendimentos-dia') },
  { path: '', redirectTo: 'agendamento', pathMatch: 'full' },
];
