export interface MeioPagamento {
  readonly id: number;
  readonly nome: string;
  readonly ativo: boolean;
}

export interface MeioPagamentoRequest {
  readonly nome: string;
}
