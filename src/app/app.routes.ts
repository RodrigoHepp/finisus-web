import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    title: tituloTraduzido('AUTENTICACAO.LOGIN.TITULO_ROTA'),
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
        title: tituloTraduzido('AUTENTICACAO.CADASTRO_USUARIO.TITULO_ROTA'),
        loadComponent: () =>
          import('./features/auth/pages/cadastro-usuario/cadastro-usuario').then(
            (arquivo) => arquivo.CadastroUsuarioPage,
          ),
      },
      {
        path: 'dashboard',
        title: tituloTraduzido('DASHBOARD.TITULO_ROTA'),
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

function tituloTraduzido(chave: string) {
  return () => inject(TranslateService).get(chave);
}
