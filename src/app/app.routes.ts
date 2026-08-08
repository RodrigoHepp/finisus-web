import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Entrar | Finisus',
    loadComponent: () =>
      import('./features/auth/pages/login/login.page').then((arquivo) => arquivo.LoginPage),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/layout/app-shell/app-shell').then((arquivo) => arquivo.AppShellComponent),
    children: [
      {
        path: 'usuarios/novo',
        title: 'Cadastrar usuário | Finisus',
        loadComponent: () =>
          import('./features/auth/pages/cadastro-usuario/cadastro-usuario').then(
            (arquivo) => arquivo.CadastroUsuarioPage,
          ),
      },
      {
        path: 'dashboard',
        title: 'Visão geral | Finisus',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard/dashboard').then(
            (arquivo) => arquivo.DashboardPage,
          ),
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
