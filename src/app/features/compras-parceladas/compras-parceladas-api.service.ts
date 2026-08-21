import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { criarParametrosPaginacao } from '../../core/api/paginacao-http';
import { PaginaResponse, ParametrosPaginacao } from '../../core/api/paginacao.model';
import { environment } from '../../environment/environment';
import { CompraParcelada, CompraParceladaRequest } from './compra-parcelada.model';

@Injectable({ providedIn: 'root' })
export class ComprasParceladasApiService {
  private readonly http = inject(HttpClient);
  private readonly urlBase = `${environment.apiUrl}/compras-parceladas`;

  listar(parametros: ParametrosPaginacao): Observable<PaginaResponse<CompraParcelada>> {
    return this.http.get<PaginaResponse<CompraParcelada>>(this.urlBase, {
      params: criarParametrosPaginacao(parametros),
    });
  }

  criar(requisicao: CompraParceladaRequest): Observable<CompraParcelada> {
    return this.http.post<CompraParcelada>(this.urlBase, requisicao);
  }

  buscar(id: number): Observable<CompraParcelada> {
    return this.http.get<CompraParcelada>(`${this.urlBase}/${id}`);
  }

  cancelar(id: number): Observable<CompraParcelada> {
    return this.http.post<CompraParcelada>(`${this.urlBase}/${id}/cancelar`, {});
  }
}
