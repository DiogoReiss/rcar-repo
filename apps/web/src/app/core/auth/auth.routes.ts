import { Routes } from '@angular/router';

export const authRoutes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login/login') },
  { path: 'forgot-password', loadComponent: () => import('./pages/forgot-password/forgot-password') },
  { path: 'reset-password', loadComponent: () => import('./pages/reset-password/reset-password') },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];

