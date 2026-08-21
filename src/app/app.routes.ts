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
        path: 'cadastros',
        title: tituloTraduzido('CADASTROS.TITULO_ROTA'),
        loadChildren: () =>
          import('./features/cadastros/cadastros.routes').then(
            (arquivo) => arquivo.CADASTROS_ROUTES,
          ),
      },
      {
        path: 'transacoes',
        title: tituloTraduzido('TRANSACOES.TITULO_ROTA'),
        loadComponent: () =>
          import('./features/transacoes/pages/lista-transacoes/lista-transacoes.page').then(
            (arquivo) => arquivo.ListaTransacoesPage,
          ),
      },
      {
        path: 'previsoes',
        loadComponent: () =>
          import('./features/previsoes/pages/previsoes/previsoes.page').then(
            (arquivo) => arquivo.PrevisoesPage,
          ),
      },
      {
        path: 'compartilhamentos',
        loadComponent: () =>
          import('./features/compartilhamentos/pages/compartilhamentos/compartilhamentos.page').then(
            (arquivo) => arquivo.CompartilhamentosPage,
          ),
      },
      {
        path: 'cartoes',
        title: tituloTraduzido('CARTOES.TITULO_ROTA'),
        loadChildren: () =>
          import('./features/cartoes/cartoes.routes').then((arquivo) => arquivo.CARTOES_ROUTES),
      },
      {
        path: '',
        loadChildren: () =>
          import('./features/planejamento-financeiro/planejamento-financeiro.routes').then(
            (arquivo) => arquivo.PLANEJAMENTO_FINANCEIRO_ROUTES,
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
