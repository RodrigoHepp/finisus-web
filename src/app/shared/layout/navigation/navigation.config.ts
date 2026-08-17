export interface ItemNavegacao {
  readonly id: string;
  readonly rotulo: string;
  readonly icone: string;
  readonly rota: string;
}

export interface GrupoNavegacao {
  readonly id: string;
  readonly rotulo: string;
  readonly icone: string;
  readonly itens: readonly ItemNavegacao[];
}

export interface ItemBreadcrumb {
  readonly rotulo: string;
  readonly rota?: string;
}

export const ITENS_NAVEGACAO_PRINCIPAL: readonly ItemNavegacao[] = [
  {
    id: 'home',
    rotulo: 'COMPARTILHADO.NAVEGACAO.HOME',
    icone: 'home',
    rota: '/dashboard',
  },
];

export const GRUPOS_NAVEGACAO: readonly GrupoNavegacao[] = [
  {
    id: 'usuarios',
    rotulo: 'COMPARTILHADO.NAVEGACAO.USUARIOS',
    icone: 'group',
    itens: [
      {
        id: 'cadastrar-usuario',
        rotulo: 'COMPARTILHADO.NAVEGACAO.CADASTRAR_USUARIO',
        icone: 'person_add',
        rota: '/usuarios/novo',
      },
    ],
  },
];

export function obterBreadcrumbs(url: string): readonly ItemBreadcrumb[] {
  const rotaAtual = normalizarRota(url);
  const inicio = ITENS_NAVEGACAO_PRINCIPAL.find((item) => item.id === 'home');
  const itemPrincipal = ITENS_NAVEGACAO_PRINCIPAL.find((item) => item.rota === rotaAtual);

  if (itemPrincipal) {
    return [paraBreadcrumb(itemPrincipal)];
  }

  for (const grupo of GRUPOS_NAVEGACAO) {
    const itemFilho = grupo.itens.find((item) => item.rota === rotaAtual);

    if (itemFilho) {
      return [
        ...(inicio ? [paraBreadcrumb(inicio)] : []),
        { rotulo: grupo.rotulo },
        paraBreadcrumb(itemFilho),
      ];
    }
  }

  return [];
}

function paraBreadcrumb(item: ItemNavegacao): ItemBreadcrumb {
  return { rotulo: item.rotulo, rota: item.rota };
}

function normalizarRota(url: string): string {
  const rotaSemParametros = url.split(/[?#]/, 1)[0] ?? '';
  const segmentos = rotaSemParametros.split('/').filter(Boolean);

  return `/${segmentos.join('/')}`;
}
