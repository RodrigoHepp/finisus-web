import type {
  Participante,
  DivisaoCompartilhada,
  Responsabilidade,
  Alocacao,
  Reembolso,
  PagamentoDivisao,
  ResumoDivisao,
  AssociacaoPendente,
  HistoricoParticipante,
} from '../../infraestrutura/api/contratos-http';
export type {
  Participante,
  DivisaoCompartilhada,
  Responsabilidade,
  Alocacao,
  Reembolso,
  PagamentoDivisao,
  ResumoDivisao,
  AssociacaoPendente,
  HistoricoParticipante,
} from '../../infraestrutura/api/contratos-http';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { URL_BASE_API } from '../../infraestrutura/api/configuracao-api';
import { Pagina } from '../../infraestrutura/api/backend.dtos';

@Injectable({ providedIn: 'root' })
export class DivisoesCompartilhadasApi {
  usuarioAtual() {
    return this.http.get<{ id: number }>(`${this.base}/usuarios/me`);
  }
  private readonly http = inject(HttpClient);
  private readonly base = inject(URL_BASE_API).replace(/\/$/, '');
  listar(pagina = 0, tamanho = 20) {
    return this.http.get<Pagina<DivisaoCompartilhada>>(`${this.base}/divisoes-compartilhadas`, {
      params: { pagina, tamanho },
    });
  }
  criar(nome: string, participantes: Participante[]) {
    return this.http.post<DivisaoCompartilhada>(`${this.base}/divisoes-compartilhadas`, {
      nome,
      participantes,
    });
  }
  consultar(id: number) {
    return this.http.get<DivisaoCompartilhada>(`${this.base}/divisoes-compartilhadas/${id}`);
  }
  participantes(id: number, participantes: Participante[]) {
    return this.http.patch<DivisaoCompartilhada>(
      `${this.base}/divisoes-compartilhadas/${id}/participantes`,
      {
        participantes,
      },
    );
  }
  historico(id: number) {
    return this.http.get<HistoricoParticipante[]>(
      `${this.base}/divisoes-compartilhadas/${id}/participantes/historico`,
    );
  }
  inativar(id: number) {
    return this.http.delete<void>(`${this.base}/divisoes-compartilhadas/${id}`);
  }
  associar(
    id: number,
    input: {
      transacaoId: number;
      baseCompartilhada: number | null;
      responsabilidades: Responsabilidade[] | null;
    },
  ) {
    return this.http.post<void>(`${this.base}/divisoes-compartilhadas/${id}/transacoes`, input);
  }
  desassociar(id: number, transacao: number) {
    return this.http.delete<void>(
      `${this.base}/divisoes-compartilhadas/${id}/transacoes/${transacao}`,
    );
  }
  alocacoes(id: number, transacao: number) {
    return this.http.get<Alocacao[]>(
      `${this.base}/divisoes-compartilhadas/${id}/transacoes/${transacao}/alocacoes`,
    );
  }
  substituirAlocacoes(
    id: number,
    transacao: number,
    alocacoes: { transacaoId: number; valor: number }[],
  ) {
    return this.http.put<Alocacao[]>(
      `${this.base}/divisoes-compartilhadas/${id}/transacoes/${transacao}/alocacoes`,
      { alocacoes },
    );
  }
  cancelarAlocacao(id: number, transacao: number, alocacao: number) {
    return this.http.delete<void>(
      `${this.base}/divisoes-compartilhadas/${id}/transacoes/${transacao}/alocacoes/${alocacao}`,
    );
  }
  registrarReembolso(
    id: number,
    input: { transacaoId: number; recebedorId: number; valor: number },
  ) {
    return this.http.post<Reembolso>(
      `${this.base}/divisoes-compartilhadas/${id}/reembolsos`,
      input,
    );
  }
  reembolsos(id: number) {
    return this.http.get<Reembolso[]>(`${this.base}/divisoes-compartilhadas/${id}/reembolsos`);
  }
  cancelarReembolso(id: number, registrarReembolso: number) {
    return this.http.delete<void>(
      `${this.base}/divisoes-compartilhadas/${id}/reembolsos/${registrarReembolso}`,
    );
  }
  pagamento(id: number, transacao: number) {
    return this.http.get<PagamentoDivisao>(
      `${this.base}/divisoes-compartilhadas/${id}/transacoes/${transacao}/pagamento`,
    );
  }
  pendencias(id: number) {
    return this.http.get<AssociacaoPendente[]>(
      `${this.base}/divisoes-compartilhadas/${id}/transacoes/pendentes-revisao`,
    );
  }
  responsabilidades(id: number, transacao: number, responsabilidades: Responsabilidade[]) {
    return this.http.put<void>(
      `${this.base}/divisoes-compartilhadas/${id}/transacoes/${transacao}/responsabilidades`,
      { responsabilidades },
    );
  }
  resumo(id: number, inicio: string, fim: string) {
    return this.http.get<ResumoDivisao>(`${this.base}/divisoes-compartilhadas/${id}/resumo`, {
      params: { inicio, fim },
    });
  }
  consultarAceite() {
    return this.http.get<{ aceita: boolean }>(`${this.base}/compartilhamentos/opt-in`);
  }
  atualizarAceite(aceita: boolean) {
    return this.http.put<{ aceita: boolean }>(`${this.base}/compartilhamentos/opt-in`, { aceita });
  }
}
