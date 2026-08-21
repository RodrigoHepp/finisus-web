import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { criarParametrosPaginacao } from '../../core/api/paginacao-http';
import { PaginaResponse, ParametrosPaginacao } from '../../core/api/paginacao.model';
import { environment } from '../../environment/environment';
import { Categoria, CategoriaRequest } from './categoria.model';

@Injectable({ providedIn: 'root' })
export class CategoriasApiService {
  private readonly http = inject(HttpClient);
  private readonly urlBase = `${environment.apiUrl}/categorias`;

  listar(parametros: ParametrosPaginacao): Observable<PaginaResponse<Categoria>> {
    return this.http.get<PaginaResponse<Categoria>>(this.urlBase, {
      params: criarParametrosPaginacao(parametros),
    });
  }

  buscar(id: number): Observable<Categoria> {
    return this.http.get<Categoria>(`${this.urlBase}/${id}`);
  }

  criar(requisicao: CategoriaRequest): Observable<Categoria> {
    return this.http.post<Categoria>(this.urlBase, requisicao);
  }

  atualizar(id: number, requisicao: CategoriaRequest): Observable<Categoria> {
    return this.http.patch<Categoria>(`${this.urlBase}/${id}`, requisicao);
  }

  inativar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.urlBase}/${id}`);
  }
}
