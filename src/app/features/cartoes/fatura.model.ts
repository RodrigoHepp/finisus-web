import { Transacao, TransacaoRequest } from '../transacoes/transacoes.models';

export type StatusFatura = 'ABERTA' | 'FECHADA' | 'PAGA' | 'CANCELADA';

export interface Fatura {
  readonly id: number;
  readonly cartaoId: number;
  readonly anoMes: string;
  readonly fechamento: string;
  readonly vencimento: string;
  readonly status: StatusFatura;
  readonly contaPagamentoId: number;
}

export interface DetalheFatura extends Fatura {
  readonly valorTotal: number;
  readonly transacoes: readonly Transacao[];
}

export interface FaturaRequest {
  readonly cartaoId: number;
  readonly anoMes: string;
  readonly dataFechamento: string;
  readonly dataVencimento: string;
  readonly contaPagamentoId: number;
}

export interface AtualizarFaturaRequest {
  readonly dataFechamento: string;
  readonly dataVencimento: string;
  readonly contaPagamentoId: number;
}

export interface PagamentoRequest {
  readonly dataPagamento: string;
}

export interface GastoFaturaRequest extends Pick<
  TransacaoRequest,
  'valor' | 'data' | 'descricao' | 'contaId' | 'categoriaId'
> {
  readonly itens?: readonly { readonly itemId: number; readonly valor: number }[];
}
