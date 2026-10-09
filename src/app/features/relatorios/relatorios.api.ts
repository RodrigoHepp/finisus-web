import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { URL_BASE_API } from '../../infraestrutura/api/configuracao-api';
import { Observable } from 'rxjs';
import {
  DashboardFinanceiroBalanceteResponse,
  DashboardFinanceiroComposicaoAnualResponse,
  DashboardFinanceiroMensalResponse,
  DashboardFinanceiroResumoAnualResponse,
  DashboardFinanceiroResumoPeriodoResponse,
  Pagina,
  PainelFinanceiroAgendaResponse,
  PainelFinanceiroAnaliseReceitasGastosResponse,
  PainelFinanceiroCompartilhadosResponse,
  PainelFinanceiroPatrimonioResponse,
  PainelFinanceiroVisaoGeralResponse,
  PrevisaoFluxoCaixaResponse,
} from '../../infraestrutura/api/backend.dtos';
export type Relatorio =
  | 'visao-geral'
  | 'mensal'
  | 'periodo'
  | 'anual'
  | 'composicao'
  | 'balancete'
  | 'balancete-anual'
  | 'agenda'
  | 'patrimonio'
  | 'compartilhados'
  | 'analise'
  | 'previsao';
export interface FiltrosRelatorio {
  referencia: string;
  inicio: string;
  fim: string;
  anoMes: string;
  ano: string;
  periodoMeses: number;
  janelaDias: number;
  tipo: string;
  categoriaId: string;
  contaId: string;
}
@Injectable({ providedIn: 'root' })
export class RelatoriosApi {
  private readonly http = inject(HttpClient);
  private readonly base = inject(URL_BASE_API);
  consultar(
    relatorio: Relatorio,
    f: FiltrosRelatorio,
    pagina: number,
  ): Observable<
    | DashboardFinanceiroBalanceteResponse
    | DashboardFinanceiroComposicaoAnualResponse
    | DashboardFinanceiroMensalResponse
    | DashboardFinanceiroResumoAnualResponse
    | DashboardFinanceiroResumoPeriodoResponse
    | Pagina<PrevisaoFluxoCaixaResponse>
    | PainelFinanceiroAgendaResponse
    | PainelFinanceiroAnaliseReceitasGastosResponse
    | PainelFinanceiroCompartilhadosResponse
    | PainelFinanceiroPatrimonioResponse
    | PainelFinanceiroVisaoGeralResponse
  > {
    const mes = { anoMes: f.anoMes };
    const periodo = { inicio: f.inicio, fim: f.fim };
    const balancete: Record<string, string | number> = { pagina, tamanho: 20 };
    if (f.tipo) balancete['tipo'] = f.tipo;
    if (f.categoriaId) balancete['categoriaId'] = f.categoriaId;
    if (f.contaId) balancete['contaId'] = f.contaId;
    switch (relatorio) {
      case 'visao-geral':
        return this.http.get<PainelFinanceiroVisaoGeralResponse>(
          `${this.base}/dashboard/visao-geral`,
          { params: { referencia: f.referencia, janelaDias: f.janelaDias } },
        );
      case 'mensal':
        return this.http.get<DashboardFinanceiroMensalResponse>(`${this.base}/dashboard/mensal`, {
          params: mes,
        });
      case 'periodo':
        return this.http.get<DashboardFinanceiroResumoPeriodoResponse>(
          `${this.base}/dashboard/resumo`,
          { params: { mesFinal: f.anoMes, periodoMeses: f.periodoMeses } },
        );
      case 'anual':
        return this.http.get<DashboardFinanceiroResumoAnualResponse>(
          `${this.base}/dashboard/anual`,
          { params: { ano: f.ano } },
        );
      case 'composicao':
        return this.http.get<DashboardFinanceiroComposicaoAnualResponse>(
          `${this.base}/dashboard/anual/composicao`,
          { params: { ano: f.ano } },
        );
      case 'balancete':
        return this.http.get<DashboardFinanceiroBalanceteResponse>(
          `${this.base}/dashboard/balancete`,
          { params: { ...mes, ...balancete } },
        );
      case 'balancete-anual':
        return this.http.get<DashboardFinanceiroBalanceteResponse>(
          `${this.base}/dashboard/balancete/anual`,
          { params: { ano: f.ano, ...balancete } },
        );
      case 'agenda':
        return this.http.get<PainelFinanceiroAgendaResponse>(`${this.base}/dashboard/agenda`, {
          params: periodo,
        });
      case 'patrimonio':
        return this.http.get<PainelFinanceiroPatrimonioResponse>(
          `${this.base}/dashboard/patrimonio`,
          { params: { referencia: f.referencia } },
        );
      case 'compartilhados':
        return this.http.get<PainelFinanceiroCompartilhadosResponse>(
          `${this.base}/dashboard/compartilhados`,
          { params: periodo },
        );
      case 'analise':
        return this.http.get<PainelFinanceiroAnaliseReceitasGastosResponse>(
          `${this.base}/dashboard/receitas-gastos`,
          { params: { mesFinal: f.anoMes, periodoMeses: f.periodoMeses } },
        );
      case 'previsao':
        return this.http.get<Pagina<PrevisaoFluxoCaixaResponse>>(
          `${this.base}/previsoes/${f.anoMes}`,
          { params: { pagina, tamanho: 20 } },
        );
    }
  }
  recalcular(meses: number) {
    return this.http.post<PrevisaoFluxoCaixaResponse[]>(`${this.base}/previsoes/recalcular`, null, {
      params: { meses },
    });
  }
}
