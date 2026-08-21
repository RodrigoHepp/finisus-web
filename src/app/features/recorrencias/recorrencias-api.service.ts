import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { criarParametrosPaginacao } from '../../core/api/paginacao-http';
import { PaginaResponse, ParametrosPaginacao } from '../../core/api/paginacao.model';
import { environment } from '../../environment/environment';
import { Transacao } from '../transacoes/transacoes.models';
import { Recorrencia, RecorrenciaRequest } from './recorrencia.model';

@Injectable({ providedIn: 'root' })
export class RecorrenciasApiService {
  private readonly http = inject(HttpClient);
  private readonly urlBase = `${environment.apiUrl}/recorrencias`;

  listar(parametros: ParametrosPaginacao): Observable<PaginaResponse<Recorrencia>> {
    return this.http.get<PaginaResponse<Recorrencia>>(this.urlBase, {
      params: criarParametrosPaginacao(parametros),
    });
  }

  criar(requisicao: RecorrenciaRequest): Observable<Recorrencia> {
    return this.http.post<Recorrencia>(this.urlBase, requisicao);
  }

  buscar(id: number): Observable<Recorrencia> {
    return this.http.get<Recorrencia>(`${this.urlBase}/${id}`);
  }

  atualizar(id: number, requisicao: RecorrenciaRequest): Observable<Recorrencia> {
    return this.http.patch<Recorrencia>(`${this.urlBase}/${id}`, requisicao);
  }

  inativar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.urlBase}/${id}`);
  }

  gerarMes(anoMes: string): Observable<readonly Transacao[]> {
    return this.http.post<readonly Transacao[]>(`${this.urlBase}/geracoes/${anoMes}`, {});
  }
}
