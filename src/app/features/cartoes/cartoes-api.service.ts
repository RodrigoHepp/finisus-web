import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { criarParametrosPaginacao } from '../../core/api/paginacao-http';
import { PaginaResponse, ParametrosPaginacao } from '../../core/api/paginacao.model';
import { environment } from '../../environment/environment';
import { Cartao, CartaoRequest } from './cartao.model';

@Injectable({ providedIn: 'root' })
export class CartoesApiService {
  private readonly http = inject(HttpClient);
  private readonly urlBase = `${environment.apiUrl}/cartoes`;

  listar(parametros: ParametrosPaginacao): Observable<PaginaResponse<Cartao>> {
    return this.http.get<PaginaResponse<Cartao>>(this.urlBase, {
      params: criarParametrosPaginacao(parametros),
    });
  }

  buscar(id: number): Observable<Cartao> {
    return this.http.get<Cartao>(`${this.urlBase}/${id}`);
  }

  criar(requisicao: CartaoRequest): Observable<Cartao> {
    return this.http.post<Cartao>(this.urlBase, requisicao);
  }

  atualizar(id: number, requisicao: CartaoRequest): Observable<Cartao> {
    return this.http.patch<Cartao>(`${this.urlBase}/${id}`, requisicao);
  }

  inativar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.urlBase}/${id}`);
  }
}
