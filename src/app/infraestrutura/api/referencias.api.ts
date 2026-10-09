import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { URL_BASE_API } from './configuracao-api';
import { Pagina } from './backend.dtos';
export type TipoReferencia = 'bancos' | 'categorias' | 'itens' | 'meios-pagamento' | 'contas';
export interface OpcaoReferencia {
  id: number;
  nome: string;
  ativo?: boolean;
}
@Injectable({ providedIn: 'root' })
export class ReferenciasApi {
  private readonly http = inject(HttpClient);
  private readonly base = inject(URL_BASE_API);
  listar(tipo: TipoReferencia, pagina: number) {
    return this.http.get<Pagina<OpcaoReferencia>>(`${this.base}/${tipo}`, {
      params: { pagina, tamanho: 20 },
    });
  }
}
