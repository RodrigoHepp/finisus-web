export type TipoConta = 'FISICO' | 'CORRENTE' | 'POUPANCA' | 'APLICACAO';

export interface Conta {
  readonly id: number;
  readonly nome: string;
  readonly tipo: TipoConta;
  readonly bancoId: number | null;
  readonly saldo: number;
  readonly ativo: boolean;
}

export interface ContaRequest {
  readonly nome: string;
  readonly tipo: TipoConta;
  readonly bancoId?: number;
}
