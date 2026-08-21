import { Routes } from '@angular/router';

export const PLANEJAMENTO_FINANCEIRO_ROUTES: Routes = [
  {
    path: 'recorrencias',
    data: { recurso: 'recorrencias' },
    loadComponent: () =>
      import('./pages/lista-planejamento/lista-planejamento.page').then(
        (arquivo) => arquivo.ListaPlanejamentoPage,
      ),
  },
  {
    path: 'compras-parceladas',
    data: { recurso: 'compras-parceladas' },
    loadComponent: () =>
      import('./pages/lista-planejamento/lista-planejamento.page').then(
        (arquivo) => arquivo.ListaPlanejamentoPage,
      ),
  },
  {
    path: 'investimentos',
    data: { recurso: 'investimentos' },
    loadComponent: () =>
      import('./pages/lista-planejamento/lista-planejamento.page').then(
        (arquivo) => arquivo.ListaPlanejamentoPage,
      ),
  },
  {
    path: 'financiamentos',
    data: { recurso: 'financiamentos' },
    loadComponent: () =>
      import('./pages/lista-planejamento/lista-planejamento.page').then(
        (arquivo) => arquivo.ListaPlanejamentoPage,
      ),
  },
];
