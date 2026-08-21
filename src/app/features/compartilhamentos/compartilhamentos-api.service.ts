import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { criarParametrosPaginacao } from '../../core/api/paginacao-http';
import { PaginaResponse, ParametrosPaginacao } from '../../core/api/paginacao.model';
import { environment } from '../../environment/environment';
import {
  ConfiguracaoCompartilhamento,
  DespesaCompartilhada,
  DespesaCompartilhadaRequest,
  DivisaoCompartilhada,
  DivisaoCompartilhadaRequest,
  ParticipanteDivisaoRequest,
  Rateio,
  RateioRecebido,
  ResumoDivisao,
} from './compartilhamento.model';

@Injectable({ providedIn: 'root' })
export class CompartilhamentosApiService {
  private readonly http = inject(HttpClient);
  private readonly urlBase = `${environment.apiUrl}/compartilhamentos`;
  private readonly divisoesUrl = `${environment.apiUrl}/divisoes-compartilhadas`;

  consultarOptIn(): Observable<ConfiguracaoCompartilhamento> {
    return this.http.get<ConfiguracaoCompartilhamento>(`${this.urlBase}/opt-in`);
  }

  atualizarOptIn(aceita: boolean): Observable<ConfiguracaoCompartilhamento> {
    return this.http.put<ConfiguracaoCompartilhamento>(`${this.urlBase}/opt-in`, { aceita });
  }

  listarDespesas(
    parametros: ParametrosPaginacao,
  ): Observable<PaginaResponse<DespesaCompartilhada>> {
    return this.http.get<PaginaResponse<DespesaCompartilhada>>(this.urlBase, {
      params: criarParametrosPaginacao(parametros),
    });
  }

  criarDespesa(requisicao: DespesaCompartilhadaRequest): Observable<DespesaCompartilhada> {
    return this.http.post<DespesaCompartilhada>(this.urlBase, requisicao);
  }

  buscarDespesa(id: number): Observable<DespesaCompartilhada> {
    return this.http.get<DespesaCompartilhada>(`${this.urlBase}/${id}`);
  }

  cancelarDespesa(id: number): Observable<DespesaCompartilhada> {
    return this.http.post<DespesaCompartilhada>(`${this.urlBase}/${id}/cancelar`, {});
  }

  listarRateios(
    despesaId: number,
    parametros: ParametrosPaginacao,
  ): Observable<PaginaResponse<Rateio>> {
    return this.http.get<PaginaResponse<Rateio>>(`${this.urlBase}/${despesaId}/rateios`, {
      params: criarParametrosPaginacao(parametros),
    });
  }

  responderRateio(rateioId: number, aceita: boolean): Observable<Rateio> {
    return this.http.post<Rateio>(`${this.urlBase}/rateios/${rateioId}/resposta`, { aceita });
  }

  pagarRateio(rateioId: number): Observable<Rateio> {
    return this.http.post<Rateio>(`${this.urlBase}/rateios/${rateioId}/pagar`, {});
  }

  listarRateiosRecebidos(
    parametros: ParametrosPaginacao,
  ): Observable<PaginaResponse<RateioRecebido>> {
    return this.http.get<PaginaResponse<RateioRecebido>>(`${this.urlBase}/rateios/recebidos`, {
      params: criarParametrosPaginacao(parametros),
    });
  }

  listarDivisoes(
    parametros: ParametrosPaginacao,
  ): Observable<PaginaResponse<DivisaoCompartilhada>> {
    return this.http.get<PaginaResponse<DivisaoCompartilhada>>(this.divisoesUrl, {
      params: criarParametrosPaginacao(parametros),
    });
  }

  criarDivisao(requisicao: DivisaoCompartilhadaRequest): Observable<DivisaoCompartilhada> {
    return this.http.post<DivisaoCompartilhada>(this.divisoesUrl, requisicao);
  }

  buscarDivisao(id: number): Observable<DivisaoCompartilhada> {
    return this.http.get<DivisaoCompartilhada>(`${this.divisoesUrl}/${id}`);
  }

  atualizarParticipantes(
    divisaoId: number,
    participantes: readonly ParticipanteDivisaoRequest[],
  ): Observable<DivisaoCompartilhada> {
    return this.http.patch<DivisaoCompartilhada>(`${this.divisoesUrl}/${divisaoId}/participantes`, {
      participantes,
    });
  }

  inativarDivisao(id: number): Observable<void> {
    return this.http.delete<void>(`${this.divisoesUrl}/${id}`);
  }

  associarTransacao(divisaoId: number, transacaoId: number): Observable<void> {
    return this.http.post<void>(`${this.divisoesUrl}/${divisaoId}/transacoes`, { transacaoId });
  }

  desassociarTransacao(divisaoId: number, transacaoId: number): Observable<void> {
    return this.http.delete<void>(`${this.divisoesUrl}/${divisaoId}/transacoes/${transacaoId}`);
  }

  consultarResumo(divisaoId: number, inicio: string, fim: string): Observable<ResumoDivisao> {
    return this.http.get<ResumoDivisao>(`${this.divisoesUrl}/${divisaoId}/resumo`, {
      params: new HttpParams().set('inicio', inicio).set('fim', fim),
    });
  }
}
