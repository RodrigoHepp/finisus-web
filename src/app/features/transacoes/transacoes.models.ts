export type TipoTransacao = 'ENTRADA' | 'SAIDA';

export interface ItemTransacao {
  readonly id: number;
  readonly itemId: number;
  readonly descricao: string;
  readonly valor: number;
  readonly categoriaId: number | null;
}

export interface Transacao {
  readonly id: number;
  readonly tipo: TipoTransacao;
  readonly valor: number;
  readonly data: string;
  readonly descricao: string;
  readonly contaId: number;
  readonly categoriaId: number | null;
  readonly meioPagamentoId: number | null;
  readonly itens: readonly ItemTransacao[];
}

export interface TransacaoRequest {
  readonly tipo: TipoTransacao;
  readonly valor: number;
  readonly data: string;
  readonly descricao: string;
  readonly contaId: number;
  readonly categoriaId?: number;
  readonly meioPagamentoId?: number;
}

export interface HistoricoTransacao {
  readonly id: number;
  readonly campoAlterado: string;
  readonly valorAnterior: string | null;
  readonly valorNovo: string | null;
  readonly alteradoPor: number;
  readonly alteradoEm: string;
}
