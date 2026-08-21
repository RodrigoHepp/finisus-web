import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../environment/environment';
import { criarParametrosPaginacao } from './paginacao-http';
import { PaginaResponse } from './paginacao.model';

export interface ReferenciaFinanceira {
  readonly id: number;
  readonly nome: string;
}

export type TipoReferenciaFinanceira =
  'bancos' | 'contas' | 'categorias' | 'itens' | 'meios-pagamento';

@Injectable({ providedIn: 'root' })
export class ReferenciasFinanceirasApiService {
  private readonly http = inject(HttpClient);

  listar(
    tipo: TipoReferenciaFinanceira,
    tamanho = 100,
  ): Observable<readonly ReferenciaFinanceira[]> {
    return this.http
      .get<PaginaResponse<ReferenciaFinanceira>>(`${environment.apiUrl}/${tipo}`, {
        params: criarParametrosPaginacao({ pagina: 0, tamanho }),
      })
      .pipe(map((pagina) => pagina.conteudo));
  }
}
