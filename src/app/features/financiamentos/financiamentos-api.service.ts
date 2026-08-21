import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { criarParametrosPaginacao } from '../../core/api/paginacao-http';
import { PaginaResponse, ParametrosPaginacao } from '../../core/api/paginacao.model';
import { environment } from '../../environment/environment';
import {
  Financiamento,
  FinanciamentoRequest,
  PagamentoParcelaRequest,
  ParcelaFinanciamento,
  Refinanciamento,
} from './financiamento.model';

@Injectable({ providedIn: 'root' })
export class FinanciamentosApiService {
  private readonly http = inject(HttpClient);
  private readonly urlBase = `${environment.apiUrl}/financiamentos`;

  listar(parametros: ParametrosPaginacao): Observable<PaginaResponse<Financiamento>> {
    return this.http.get<PaginaResponse<Financiamento>>(this.urlBase, {
      params: criarParametrosPaginacao(parametros),
    });
  }

  criar(requisicao: FinanciamentoRequest): Observable<Financiamento> {
    return this.http.post<Financiamento>(this.urlBase, requisicao);
  }

  buscar(id: number): Observable<Financiamento> {
    return this.http.get<Financiamento>(`${this.urlBase}/${id}`);
  }

  cancelar(id: number): Observable<Financiamento> {
    return this.http.post<Financiamento>(`${this.urlBase}/${id}/cancelar`, {});
  }

  listarParcelas(
    financiamentoId: number,
    parametros: ParametrosPaginacao,
  ): Observable<PaginaResponse<ParcelaFinanciamento>> {
    return this.http.get<PaginaResponse<ParcelaFinanciamento>>(
      `${this.urlBase}/${financiamentoId}/parcelas`,
      {
        params: criarParametrosPaginacao(parametros),
      },
    );
  }

  pagarParcela(
    financiamentoId: number,
    parcelaId: number,
    requisicao: PagamentoParcelaRequest,
  ): Observable<ParcelaFinanciamento> {
    return this.http.post<ParcelaFinanciamento>(
      `${this.urlBase}/${financiamentoId}/parcelas/${parcelaId}/pagar`,
      requisicao,
    );
  }

  refinanciarParcela(financiamentoId: number, parcelaId: number): Observable<Refinanciamento> {
    return this.http.post<Refinanciamento>(
      `${this.urlBase}/${financiamentoId}/parcelas/${parcelaId}/refinanciamento`,
      {},
    );
  }

  corrigirErroDeLancamento(
    financiamentoId: number,
    parcelaId: number,
  ): Observable<readonly ParcelaFinanciamento[]> {
    return this.http.delete<readonly ParcelaFinanciamento[]>(
      `${this.urlBase}/${financiamentoId}/parcelas/${parcelaId}/erro-de-lancamento`,
    );
  }
}
