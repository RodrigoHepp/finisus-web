export interface Categoria {
  readonly id: number;
  readonly nome: string;
  readonly categoriaPaiId: number | null;
  readonly ativo: boolean;
}

export interface CategoriaRequest {
  readonly nome: string;
  readonly categoriaPaiId?: number;
}
