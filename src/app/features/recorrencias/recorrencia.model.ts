import { TipoTransacao } from '../transacoes/transacoes.models';

export interface Recorrencia {
  readonly id: number;
  readonly nome: string;
  readonly tipo: TipoTransacao;
  readonly valorEsperado: number;
  readonly diaDoMes: number;
  readonly categoriaId: number | null;
  readonly contaId: number;
  readonly meioPagamentoId: number | null;
  readonly ativo: boolean;
}

export interface RecorrenciaRequest {
  readonly nome: string;
  readonly tipo: TipoTransacao;
  readonly valorEsperado: number;
  readonly diaDoMes: number;
  readonly categoriaId?: number;
  readonly contaId: number;
  readonly meioPagamentoId?: number;
}
