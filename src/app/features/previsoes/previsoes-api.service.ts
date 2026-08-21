import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { criarParametrosPaginacao } from '../../core/api/paginacao-http';
import { PaginaResponse, ParametrosPaginacao } from '../../core/api/paginacao.model';
import { environment } from '../../environment/environment';
import { PrevisaoMensal } from './previsao.model';

@Injectable({ providedIn: 'root' })
export class PrevisoesApiService {
  private readonly http = inject(HttpClient);
  private readonly urlBase = `${environment.apiUrl}/previsoes`;

  recalcular(meses = 3): Observable<readonly PrevisaoMensal[]> {
    return this.http.post<readonly PrevisaoMensal[]>(`${this.urlBase}/recalcular`, null, {
      params: new HttpParams().set('meses', meses),
    });
  }

  consultar(
    anoMes: string,
    parametros: ParametrosPaginacao,
  ): Observable<PaginaResponse<PrevisaoMensal>> {
    return this.http.get<PaginaResponse<PrevisaoMensal>>(`${this.urlBase}/${anoMes}`, {
      params: criarParametrosPaginacao(parametros),
    });
  }
}
