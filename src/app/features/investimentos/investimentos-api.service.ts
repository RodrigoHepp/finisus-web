import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { criarParametrosPaginacao } from '../../core/api/paginacao-http';
import { PaginaResponse, ParametrosPaginacao } from '../../core/api/paginacao.model';
import { environment } from '../../environment/environment';
import {
  Investimento,
  InvestimentoRequest,
  MovimentoInvestimento,
  MovimentoInvestimentoRequest,
} from './investimento.model';

@Injectable({ providedIn: 'root' })
export class InvestimentosApiService {
  private readonly http = inject(HttpClient);
  private readonly urlBase = `${environment.apiUrl}/investimentos`;

  listar(parametros: ParametrosPaginacao): Observable<PaginaResponse<Investimento>> {
    return this.http.get<PaginaResponse<Investimento>>(this.urlBase, {
      params: criarParametrosPaginacao(parametros),
    });
  }

  criar(requisicao: InvestimentoRequest): Observable<Investimento> {
    return this.http.post<Investimento>(this.urlBase, requisicao);
  }

  buscar(id: number): Observable<Investimento> {
    return this.http.get<Investimento>(`${this.urlBase}/${id}`);
  }

  atualizar(id: number, requisicao: InvestimentoRequest): Observable<Investimento> {
    return this.http.patch<Investimento>(`${this.urlBase}/${id}`, requisicao);
  }

  inativar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.urlBase}/${id}`);
  }

  listarMovimentos(
    investimentoId: number,
    parametros: ParametrosPaginacao,
  ): Observable<PaginaResponse<MovimentoInvestimento>> {
    return this.http.get<PaginaResponse<MovimentoInvestimento>>(
      `${this.urlBase}/${investimentoId}/movimentos`,
      { params: criarParametrosPaginacao(parametros) },
    );
  }

  movimentar(requisicao: MovimentoInvestimentoRequest): Observable<MovimentoInvestimento> {
    return this.http.post<MovimentoInvestimento>(`${this.urlBase}/movimentos`, requisicao);
  }

  estornarMovimento(id: number): Observable<MovimentoInvestimento> {
    return this.http.post<MovimentoInvestimento>(`${this.urlBase}/movimentos/${id}/estornar`, {});
  }
}
