export interface CompraParcelada {
  readonly id: number;
  readonly descricao: string;
  readonly valorTotal: number;
  readonly numeroParcelas: number;
  readonly dataCompra: string;
  readonly categoriaId: number | null;
  readonly contaId: number;
  readonly canceladaEm: string | null;
}

export interface CompraParceladaRequest {
  readonly descricao: string;
  readonly valorTotal: number;
  readonly numeroParcelas: number;
  readonly dataCompra: string;
  readonly categoriaId?: number;
  readonly contaId: number;
}
