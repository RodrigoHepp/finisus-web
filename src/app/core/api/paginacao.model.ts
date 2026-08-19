export interface PaginaResponse<T> {
  readonly conteudo: readonly T[];
  readonly pagina: number;
  readonly tamanho: number;
  readonly totalElementos: number;
  readonly totalPaginas: number;
}

export interface ParametrosPaginacao {
  readonly pagina: number;
  readonly tamanho: number;
}

export const PAGINACAO_PADRAO: ParametrosPaginacao = {
  pagina: 0,
  tamanho: 20,
};
