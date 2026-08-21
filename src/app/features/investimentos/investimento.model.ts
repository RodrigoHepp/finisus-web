export type TipoInvestimento = 'RENDA_FIXA' | 'RENDA_VARIAVEL' | 'FUNDO' | 'CRIPTO' | 'OUTRO';
export type TipoMovimentoInvestimento = 'APORTE' | 'RESGATE';

export interface Investimento {
  readonly id: number;
  readonly nome: string;
  readonly tipo: TipoInvestimento;
  readonly contaOrigemId: number;
  readonly ativo: boolean;
}

export interface InvestimentoRequest {
  readonly nome: string;
  readonly tipo: TipoInvestimento;
  readonly contaOrigemId: number;
}

export interface MovimentoInvestimento {
  readonly id: number;
  readonly investimentoId: number;
  readonly tipo: TipoMovimentoInvestimento;
  readonly valor: number;
  readonly data: string;
  readonly transacaoId: number | null;
  readonly movimentoOrigemId: number | null;
  readonly estornadoEm: string | null;
}

export interface MovimentoInvestimentoRequest {
  readonly investimentoId: number;
  readonly tipo: TipoMovimentoInvestimento;
  readonly valor: number;
  readonly data: string;
}
