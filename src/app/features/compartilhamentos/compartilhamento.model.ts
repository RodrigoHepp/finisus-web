export type TipoRateio = 'VALOR_FIXO' | 'PERCENTUAL';
export type TipoParticipante = 'INTERNO' | 'EXTERNO';
export type StatusRateio = 'PENDENTE' | 'ACEITO' | 'RECUSADO' | 'PAGO' | 'CANCELADO';
export type StatusDespesaCompartilhada = 'ATIVA' | 'CANCELADA';
export type StatusDivisaoCompartilhada = 'ATIVA' | 'INATIVA';

export interface ConfiguracaoCompartilhamento {
  readonly aceita: boolean;
}

export interface ParticipanteDespesaRequest {
  readonly usuarioId?: number;
  readonly nomeExterno?: string;
  readonly emailExterno?: string;
  readonly valorFixo?: number;
  readonly percentual?: number;
}

export interface DespesaCompartilhadaRequest {
  readonly transacaoId: number;
  readonly transacaoItemId?: number;
  readonly tipoRateio: TipoRateio;
  readonly participantes: readonly ParticipanteDespesaRequest[];
}

export interface DespesaCompartilhada {
  readonly id: number;
  readonly transacaoId: number;
  readonly transacaoItemId: number | null;
  readonly status: StatusDespesaCompartilhada;
  readonly participantes: number;
}

export interface Rateio {
  readonly id: number;
  readonly participante: TipoParticipante;
  readonly usuarioId: number | null;
  readonly nomeExterno: string | null;
  readonly valorFixo: number | null;
  readonly percentual: number | null;
  readonly status: StatusRateio;
}

export interface RateioRecebido {
  readonly id: number;
  readonly status: StatusRateio;
  readonly despesaId: number;
  readonly transacaoId: number;
  readonly transacaoItemId: number | null;
  readonly valorFixo: number | null;
  readonly percentual: number | null;
}

export interface ParticipanteDivisaoRequest {
  readonly usuarioId: number;
  readonly percentual: number;
}

export interface DivisaoCompartilhadaRequest {
  readonly nome: string;
  readonly participantes: readonly ParticipanteDivisaoRequest[];
}

export interface DivisaoCompartilhada {
  readonly id: number;
  readonly nome: string;
  readonly criadorId: number;
  readonly status: StatusDivisaoCompartilhada;
  readonly participantes: readonly ParticipanteDivisaoRequest[];
}

export interface ResumoParticipanteDivisao extends ParticipanteDivisaoRequest {
  readonly pago: number;
  readonly devido: number;
  readonly saldo: number;
}

export interface ResumoDivisao {
  readonly divisaoId: number;
  readonly divisao: string;
  readonly total: number;
  readonly participantes: readonly ResumoParticipanteDivisao[];
}
