import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { criarParametrosPaginacao } from '../../core/api/paginacao-http';
import { PaginaResponse, ParametrosPaginacao } from '../../core/api/paginacao.model';
import { environment } from '../../environment/environment';
import { Conta, ContaRequest } from './conta.model';

@Injectable({ providedIn: 'root' })
export class ContasApiService {
  private readonly http = inject(HttpClient);
  private readonly urlBase = `${environment.apiUrl}/contas`;

  listar(parametros: ParametrosPaginacao): Observable<PaginaResponse<Conta>> {
    return this.http.get<PaginaResponse<Conta>>(this.urlBase, {
      params: criarParametrosPaginacao(parametros),
    });
  }

  buscar(id: number): Observable<Conta> {
    return this.http.get<Conta>(`${this.urlBase}/${id}`);
  }

  criar(requisicao: ContaRequest): Observable<Conta> {
    return this.http.post<Conta>(this.urlBase, requisicao);
  }

  atualizar(id: number, requisicao: ContaRequest): Observable<Conta> {
    return this.http.patch<Conta>(`${this.urlBase}/${id}`, requisicao);
  }

  inativar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.urlBase}/${id}`);
  }
}
