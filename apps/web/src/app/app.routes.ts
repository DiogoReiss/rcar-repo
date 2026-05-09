import { Routes } from '@angular/router';

import { authGuard } from '@core/auth/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./public/home/home'),
  },
  {
    path: 'auth',
    loadChildren: () => import('@core/auth/auth.routes').then((m) => m.authRoutes),
  },
  {
    path: '',
    loadComponent: () => import('@core/layout/shell/shell'),
    canActivate: [authGuard],
    children: [
      {
        path: 'admin',
        loadChildren: () => import('@admin/admin.routes').then((m) => m.adminRoutes),
      },
      {
        path: 'lavajato',
        loadChildren: () => import('@lavajato/lavajato.routes').then((m) => m.lavajatoRoutes),
      },
      {
        path: 'aluguel',
        loadChildren: () => import('@aluguel/aluguel.routes').then((m) => m.aluguelRoutes),
      },
      {
        path: 'portal',
        loadChildren: () => import('@portal/portal.routes').then((m) => m.portalRoutes),
      },
      { path: '', redirectTo: 'admin', pathMatch: 'full' },
    ],
  },
];
