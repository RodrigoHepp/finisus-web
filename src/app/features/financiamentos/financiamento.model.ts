export type StatusFinanciamento = 'ATIVO' | 'CANCELADO' | 'FINALIZADO';
export type StatusParcelaFinanciamento = 'PENDENTE' | 'PAGA' | 'ATRASADA';

export interface Financiamento {
  readonly id: number;
  readonly descricao: string;
  readonly principal: number;
  readonly taxaJurosMensal: number;
  readonly numeroParcelas: number;
  readonly dataInicio: string;
  readonly contaId: number;
  readonly status: StatusFinanciamento;
}

export interface FinanciamentoRequest {
  readonly descricao: string;
  readonly principal: number;
  readonly taxaJurosMensal: number;
  readonly numeroParcelas: number;
  readonly dataInicio: string;
  readonly contaId: number;
}

export interface ParcelaFinanciamento {
  readonly id: number;
  readonly numero: number;
  readonly valor: number;
  readonly vencimento: string;
  readonly status: StatusParcelaFinanciamento;
}

export interface PagamentoParcelaRequest {
  readonly dataPagamento: string;
}

export interface Refinanciamento {
  readonly financiamentoId: number;
  readonly finalizadoEm: string;
  readonly parcelasExcluidas: number;
  readonly mensagem: string;
}
