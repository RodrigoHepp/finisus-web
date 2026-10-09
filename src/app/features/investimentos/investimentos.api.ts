import type {
  Investimento,
  InvestimentoInput,
  MovimentoInvestimento,
  MovimentoInvestimentoInput,
  PosicaoInvestimento,
  OpcaoConta,
} from '../../infraestrutura/api/contratos-http';
export type {
  Investimento,
  InvestimentoInput,
  MovimentoInvestimento,
  MovimentoInvestimentoInput,
  PosicaoInvestimento,
  OpcaoConta,
} from '../../infraestrutura/api/contratos-http';
import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { URL_BASE_API } from '../../infraestrutura/api/configuracao-api';
import type { Pagina } from '../../infraestrutura/api/backend.dtos';

@Injectable({ providedIn: 'root' })
export class InvestimentosApi {
  private readonly http = inject(HttpClient);
  private readonly base = inject(URL_BASE_API).replace(/\/$/, '');
  listar(pagina = 0, tamanho = 20) {
    return this.http.get<Pagina<Investimento>>(`${this.base}/investimentos`, {
      params: { pagina, tamanho },
    });
  }
  consultar(id: number) {
    return this.http.get<Investimento>(`${this.base}/investimentos/${id}`);
  }
  salvar(input: InvestimentoInput, id?: number) {
    return id
      ? this.http.patch<Investimento>(`${this.base}/investimentos/${id}`, input)
      : this.http.post<Investimento>(`${this.base}/investimentos`, input);
  }
  inativar(id: number) {
    return this.http.delete<void>(`${this.base}/investimentos/${id}`);
  }
  movimentos(id: number, pagina = 0, tamanho = 20) {
    return this.http.get<Pagina<MovimentoInvestimento>>(
      `${this.base}/investimentos/${id}/movimentos`,
      {
        params: { pagina, tamanho },
      },
    );
  }
  registrarMovimento(input: MovimentoInvestimentoInput) {
    return this.http.post<MovimentoInvestimento>(`${this.base}/investimentos/movimentos`, input);
  }
  estornar(id: number) {
    return this.http.post<MovimentoInvestimento>(
      `${this.base}/investimentos/movimentos/${id}/estornar`,
      {},
    );
  }
  posicoes(id: number, pagina = 0, tamanho = 20) {
    return this.http.get<Pagina<PosicaoInvestimento>>(`${this.base}/investimentos/${id}/posicoes`, {
      params: { pagina, tamanho },
    });
  }
  registrarPosicao(id: number, input: Pick<PosicaoInvestimento, 'valor' | 'dataReferencia'>) {
    return this.http.post<PosicaoInvestimento>(`${this.base}/investimentos/${id}/posicoes`, input);
  }
  contas(pagina = 0) {
    return this.http.get<Pagina<OpcaoConta>>(`${this.base}/contas`, {
      params: new HttpParams().set('pagina', pagina).set('tamanho', 100),
    });
  }
}
