import { Routes } from '@angular/router';

export const CARTOES_ROUTES: Routes = [
  {
    path: ':cartaoId/faturas',
    loadComponent: () => import('./faturas.page').then((arquivo) => arquivo.FaturasPage),
  },
  {
    path: '',
    loadComponent: () => import('./lista-cartoes.page').then((arquivo) => arquivo.ListaCartoesPage),
  },
];
