import { Routes } from '@angular/router';

export const CADASTROS_ROUTES: Routes = [
  {
    path: 'bancos',
    loadComponent: () =>
      import('../bancos/pages/lista-bancos/lista-bancos.page').then(
        (arquivo) => arquivo.ListaBancosPage,
      ),
  },
  {
    path: 'contas',
    loadComponent: () =>
      import('../contas/pages/lista-contas/lista-contas.page').then(
        (arquivo) => arquivo.ListaContasPage,
      ),
  },
  {
    path: 'categorias',
    loadComponent: () =>
      import('../categorias/pages/lista-categorias/lista-categorias.page').then(
        (arquivo) => arquivo.ListaCategoriasPage,
      ),
  },
  {
    path: 'itens',
    loadComponent: () =>
      import('../itens/pages/lista-itens/lista-itens.page').then(
        (arquivo) => arquivo.ListaItensPage,
      ),
  },
  {
    path: 'meios-pagamento',
    loadComponent: () =>
      import('../meios-pagamento/pages/lista-meios-pagamento/lista-meios-pagamento.page').then(
        (arquivo) => arquivo.ListaMeiosPagamentoPage,
      ),
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'bancos',
  },
];
