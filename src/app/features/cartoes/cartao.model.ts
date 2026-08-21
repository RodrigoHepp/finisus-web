export interface Cartao {
  readonly id: number;
  readonly nome: string;
  readonly limite: number;
  readonly diaFechamento: number;
  readonly diaVencimento: number;
  readonly ativo: boolean;
}

export interface CartaoRequest {
  readonly nome: string;
  readonly limite: number;
  readonly diaFechamento: number;
  readonly diaVencimento: number;
}
