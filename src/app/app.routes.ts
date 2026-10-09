import { Routes } from '@angular/router';

import { permissaoGuard, sessaoGuard } from './infraestrutura/sessao/sessao.guard';
import { alteracoesPendentesGuard } from './infraestrutura/alteracoes-pendentes.guard';
export const rotas: Routes = [
  {
    path: 'entrar',
    loadComponent: () => import('./features/sessao/sessao.page').then((m) => m.SessaoPage),
  },
  {
    path: 'cadastro',
    pathMatch: 'full',
    redirectTo: 'usuarios',
  },
  {
    path: '',
    canActivate: [sessaoGuard],
    loadComponent: () =>
      import('./shared/estrutura-principal.component').then((m) => m.EstruturaPrincipalComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'visao-geral' },
      {
        path: 'usuarios',
        data: { permissoes: ['USUARIO_CADASTRAR', 'USUARIO_DESBLOQUEAR'] },
        canActivate: [permissaoGuard],
        canDeactivate: [alteracoesPendentesGuard],
        loadComponent: () =>
          import('./features/acesso-usuarios/acesso-usuarios.page').then(
            (m) => m.AcessoUsuariosPage,
          ),
      },
      {
        path: 'visao-geral',
        data: { jornada: 'visao-geral' },
        loadComponent: () =>
          import('./features/relatorios/relatorios.page').then((m) => m.RelatoriosPage),
      },
      {
        path: 'relatorios',
        data: { jornada: 'relatorios' },
        loadComponent: () =>
          import('./features/relatorios/relatorios.page').then((m) => m.RelatoriosPage),
      },
      {
        path: 'cadastros',
        data: { jornada: 'cadastros' },
        canDeactivate: [alteracoesPendentesGuard],
        loadComponent: () =>
          import('./features/dia-a-dia/dia-a-dia.page').then((m) => m.DiaADiaPage),
      },
      {
        path: 'contas',
        data: { jornada: 'contas' },
        canDeactivate: [alteracoesPendentesGuard],
        loadComponent: () =>
          import('./features/dia-a-dia/dia-a-dia.page').then((m) => m.DiaADiaPage),
      },
      {
        path: 'movimentacoes',
        data: { jornada: 'movimentacoes' },
        canDeactivate: [alteracoesPendentesGuard],
        loadComponent: () =>
          import('./features/dia-a-dia/dia-a-dia.page').then((m) => m.DiaADiaPage),
      },
      {
        path: 'cartoes',
        data: { jornada: 'cartoes' },
        canDeactivate: [alteracoesPendentesGuard],
        loadComponent: () =>
          import('./features/compromissos/compromissos.page').then((m) => m.CompromissosPage),
      },
      {
        path: 'compromissos',
        data: { jornada: 'compromissos' },
        canDeactivate: [alteracoesPendentesGuard],
        loadComponent: () =>
          import('./features/compromissos/compromissos.page').then((m) => m.CompromissosPage),
      },
      {
        path: 'investimentos',
        canDeactivate: [alteracoesPendentesGuard],
        loadComponent: () =>
          import('./features/investimentos/investimentos.page').then((m) => m.InvestimentosPage),
      },
      {
        path: 'compartilhamentos',
        canDeactivate: [alteracoesPendentesGuard],
        loadComponent: () =>
          import('./features/divisoes-compartilhadas/divisoes-compartilhadas.page').then(
            (m) => m.DivisoesCompartilhadasPage,
          ),
      },
      {
        path: 'importacoes',
        canDeactivate: [alteracoesPendentesGuard],
        loadComponent: () =>
          import('./features/importacoes/importacoes.page').then((m) => m.ImportacoesPage),
      },
      {
        path: 'perfil',
        canDeactivate: [alteracoesPendentesGuard],
        loadComponent: () => import('./features/perfil/perfil.page').then((m) => m.PerfilPage),
      },
    ],
  },
  { path: '**', redirectTo: 'visao-geral' },
];
