export interface Banco {
  readonly id: number;
  readonly nome: string;
  readonly codigo: string;
  readonly sistema: boolean;
}

export interface BancoRequest {
  readonly nome: string;
  readonly codigo: string;
}
