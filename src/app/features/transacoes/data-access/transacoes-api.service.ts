import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { criarParametrosPaginacao } from '../../../core/api/paginacao-http';
import { PaginaResponse, ParametrosPaginacao } from '../../../core/api/paginacao.model';
import { environment } from '../../../environment/environment';
import { HistoricoTransacao, Transacao, TransacaoRequest } from '../transacoes.models';

@Injectable({ providedIn: 'root' })
export class TransacoesApiService {
  private readonly http = inject(HttpClient);
  private readonly urlBase = `${environment.apiUrl}/transacoes`;

  listar(parametros: ParametrosPaginacao): Observable<PaginaResponse<Transacao>> {
    return this.http.get<PaginaResponse<Transacao>>(this.urlBase, {
      params: this.paginacao(parametros),
    });
  }

  buscar(id: number): Observable<Transacao> {
    return this.http.get<Transacao>(`${this.urlBase}/${id}`);
  }

  criar(requisicao: TransacaoRequest): Observable<Transacao> {
    return this.http.post<Transacao>(this.urlBase, requisicao);
  }

  atualizar(id: number, requisicao: TransacaoRequest): Observable<Transacao> {
    return this.http.patch<Transacao>(`${this.urlBase}/${id}`, requisicao);
  }

  estornar(id: number): Observable<Transacao> {
    return this.http.post<Transacao>(`${this.urlBase}/${id}/estorno`, {});
  }

  listarHistorico(
    id: number,
    parametros: ParametrosPaginacao,
  ): Observable<PaginaResponse<HistoricoTransacao>> {
    return this.http.get<PaginaResponse<HistoricoTransacao>>(`${this.urlBase}/${id}/historico`, {
      params: this.paginacao(parametros),
    });
  }

  private paginacao(parametros: ParametrosPaginacao): HttpParams {
    return criarParametrosPaginacao(parametros);
  }
}
