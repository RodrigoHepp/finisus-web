import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { criarParametrosPaginacao } from '../../core/api/paginacao-http';
import { PaginaResponse, ParametrosPaginacao } from '../../core/api/paginacao.model';
import { environment } from '../../environment/environment';
import { Banco, BancoRequest } from './banco.model';

@Injectable({ providedIn: 'root' })
export class BancosApiService {
  private readonly http = inject(HttpClient);
  private readonly urlBase = `${environment.apiUrl}/bancos`;

  listar(parametros: ParametrosPaginacao): Observable<PaginaResponse<Banco>> {
    return this.http.get<PaginaResponse<Banco>>(this.urlBase, {
      params: criarParametrosPaginacao(parametros),
    });
  }

  buscar(id: number): Observable<Banco> {
    return this.http.get<Banco>(`${this.urlBase}/${id}`);
  }

  criar(requisicao: BancoRequest): Observable<Banco> {
    return this.http.post<Banco>(this.urlBase, requisicao);
  }

  atualizar(id: number, requisicao: BancoRequest): Observable<Banco> {
    return this.http.patch<Banco>(`${this.urlBase}/${id}`, requisicao);
  }

  inativar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.urlBase}/${id}`);
  }
}
