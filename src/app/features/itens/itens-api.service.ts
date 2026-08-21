import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { criarParametrosPaginacao } from '../../core/api/paginacao-http';
import { PaginaResponse, ParametrosPaginacao } from '../../core/api/paginacao.model';
import { environment } from '../../environment/environment';
import { Item, ItemRequest } from './item.model';

@Injectable({ providedIn: 'root' })
export class ItensApiService {
  private readonly http = inject(HttpClient);
  private readonly urlBase = `${environment.apiUrl}/itens`;

  listar(parametros: ParametrosPaginacao): Observable<PaginaResponse<Item>> {
    return this.http.get<PaginaResponse<Item>>(this.urlBase, {
      params: criarParametrosPaginacao(parametros),
    });
  }

  buscar(id: number): Observable<Item> {
    return this.http.get<Item>(`${this.urlBase}/${id}`);
  }

  criar(requisicao: ItemRequest): Observable<Item> {
    return this.http.post<Item>(this.urlBase, requisicao);
  }

  atualizar(id: number, requisicao: ItemRequest): Observable<Item> {
    return this.http.patch<Item>(`${this.urlBase}/${id}`, requisicao);
  }

  inativar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.urlBase}/${id}`);
  }
}
