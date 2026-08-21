import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { criarParametrosPaginacao } from '../../core/api/paginacao-http';
import { PaginaResponse, ParametrosPaginacao } from '../../core/api/paginacao.model';
import { environment } from '../../environment/environment';
import { MeioPagamento, MeioPagamentoRequest } from './meio-pagamento.model';

@Injectable({ providedIn: 'root' })
export class MeiosPagamentoApiService {
  private readonly http = inject(HttpClient);
  private readonly urlBase = `${environment.apiUrl}/meios-pagamento`;

  listar(parametros: ParametrosPaginacao): Observable<PaginaResponse<MeioPagamento>> {
    return this.http.get<PaginaResponse<MeioPagamento>>(this.urlBase, {
      params: criarParametrosPaginacao(parametros),
    });
  }

  buscar(id: number): Observable<MeioPagamento> {
    return this.http.get<MeioPagamento>(`${this.urlBase}/${id}`);
  }

  criar(requisicao: MeioPagamentoRequest): Observable<MeioPagamento> {
    return this.http.post<MeioPagamento>(this.urlBase, requisicao);
  }

  atualizar(id: number, requisicao: MeioPagamentoRequest): Observable<MeioPagamento> {
    return this.http.patch<MeioPagamento>(`${this.urlBase}/${id}`, requisicao);
  }

  inativar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.urlBase}/${id}`);
  }
}
