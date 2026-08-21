export interface Item {
  readonly id: number;
  readonly nome: string;
  readonly categoriaPadraoId: number | null;
  readonly ativo: boolean;
}

export interface ItemRequest {
  readonly nome: string;
  readonly categoriaPadraoId?: number;
}
