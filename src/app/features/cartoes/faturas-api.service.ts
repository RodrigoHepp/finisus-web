import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { criarParametrosPaginacao } from '../../core/api/paginacao-http';
import { PaginaResponse, ParametrosPaginacao } from '../../core/api/paginacao.model';
import { environment } from '../../environment/environment';
import { Transacao } from '../transacoes/transacoes.models';
import {
  AtualizarFaturaRequest,
  DetalheFatura,
  Fatura,
  FaturaRequest,
  GastoFaturaRequest,
  PagamentoRequest,
} from './fatura.model';

@Injectable({ providedIn: 'root' })
export class FaturasApiService {
  private readonly http = inject(HttpClient);
  private readonly urlBase = `${environment.apiUrl}/cartoes/faturas`;

  listarPorCartao(
    cartaoId: number,
    parametros: ParametrosPaginacao,
  ): Observable<PaginaResponse<Fatura>> {
    return this.http.get<PaginaResponse<Fatura>>(
      `${environment.apiUrl}/cartoes/${cartaoId}/faturas`,
      {
        params: criarParametrosPaginacao(parametros),
      },
    );
  }

  criar(requisicao: FaturaRequest): Observable<Fatura> {
    return this.http.post<Fatura>(this.urlBase, requisicao);
  }

  buscar(id: number): Observable<DetalheFatura> {
    return this.http.get<DetalheFatura>(`${this.urlBase}/${id}`);
  }

  lancarGasto(id: number, requisicao: GastoFaturaRequest): Observable<Transacao> {
    return this.http.post<Transacao>(`${this.urlBase}/${id}/gastos`, requisicao);
  }

  fechar(id: number): Observable<Fatura> {
    return this.http.post<Fatura>(`${this.urlBase}/${id}/fechar`, {});
  }

  pagar(id: number, requisicao: PagamentoRequest): Observable<Fatura> {
    return this.http.post<Fatura>(`${this.urlBase}/${id}/pagar`, requisicao);
  }

  atualizar(id: number, requisicao: AtualizarFaturaRequest): Observable<Fatura> {
    return this.http.patch<Fatura>(`${this.urlBase}/${id}`, requisicao);
  }

  cancelar(id: number): Observable<Fatura> {
    return this.http.post<Fatura>(`${this.urlBase}/${id}/cancelar`, {});
  }
}
