import type {
  PaginaCompromissos,
  CartaoRequest,
  Cartao,
  FaturaRequest,
  Fatura,
  PagamentoFatura,
  DespesaFatura,
  TransacaoFatura,
  DetalheFatura,
  CicloFaturas,
  Obrigacao,
  PagamentoObrigacaoRequest,
  PagamentoObrigacao,
  RecorrenciaRequest,
  Recorrencia,
  Ocorrencia,
  FinanciamentoRequest,
  Parcela,
  ParcelaHistorica,
  AmortizacaoRequest,
  Amortizacao,
  Refinanciamento,
  RefinanciamentoParcelas,
  ContaElegivel,
  CategoriaElegivel,
  MeioElegivel,
  ItemElegivel,
  TipoCompromisso,
  CompromissoResponses,
  CompromissoRequests,
} from '../../infraestrutura/api/contratos-http';
export type {
  PaginaCompromissos,
  CartaoRequest,
  Cartao,
  FaturaRequest,
  Fatura,
  PagamentoFatura,
  DespesaFatura,
  ItemDespesa,
  TransacaoFatura,
  DetalheFatura,
  CicloFaturas,
  CompraRequest,
  Compra,
  ObrigacaoRequest,
  Obrigacao,
  PagamentoObrigacaoRequest,
  PagamentoObrigacao,
  RecorrenciaRequest,
  Recorrencia,
  Ocorrencia,
  FinanciamentoRequest,
  Financiamento,
  Parcela,
  ParcelaHistorica,
  AmortizacaoRequest,
  Amortizacao,
  Refinanciamento,
  RefinanciamentoParcelas,
  ContaElegivel,
  CategoriaElegivel,
  MeioElegivel,
  ItemElegivel,
  TipoCompromisso,
  CompromissoResponses,
  CompromissoRequests,
} from '../../infraestrutura/api/contratos-http';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { URL_BASE_API } from '../../infraestrutura/api/configuracao-api';

const caminhos: Record<TipoCompromisso, string> = {
  cartoes: 'cartoes',
  compras: 'compras-parceladas',
  obrigacoes: 'obrigacoes-financeiras',
  recorrencias: 'recorrencias',
  financiamentos: 'financiamentos',
};

@Injectable({ providedIn: 'root' })
export class CompromissosApi {
  private readonly http = inject(HttpClient);
  private readonly base = inject(URL_BASE_API);
  private parametros(pagina: number) {
    return new HttpParams().set('pagina', pagina).set('tamanho', 20);
  }
  listar<K extends TipoCompromisso>(
    tipo: K,
    pagina: number,
    filtros: { status?: string; inicio?: string; fim?: string } = {},
  ) {
    let parametros = this.parametros(pagina);
    if (tipo === 'obrigacoes')
      for (const [chave, valor] of Object.entries(filtros))
        if (valor) parametros = parametros.set(chave, valor);
    return this.http.get<PaginaCompromissos<CompromissoResponses[K]>>(
      `${this.base}/${caminhos[tipo]}`,
      {
        params: parametros,
      },
    );
  }
  detalhar<K extends TipoCompromisso>(tipo: K, id: number) {
    return this.http.get<CompromissoResponses[K]>(`${this.base}/${caminhos[tipo]}/${id}`);
  }
  criar<K extends TipoCompromisso>(tipo: K, corpo: CompromissoRequests[K]) {
    return this.http.post<CompromissoResponses[K]>(`${this.base}/${caminhos[tipo]}`, corpo);
  }
  atualizarCartao(id: number, corpo: CartaoRequest) {
    return this.http.patch<Cartao>(`${this.base}/cartoes/${id}`, corpo);
  }
  atualizarRecorrencia(id: number, corpo: RecorrenciaRequest) {
    return this.http.patch<Recorrencia>(`${this.base}/recorrencias/${id}`, corpo);
  }
  inativar(tipo: 'cartoes' | 'recorrencias', id: number) {
    return this.http.delete<void>(`${this.base}/${caminhos[tipo]}/${id}`);
  }
  cancelar(tipo: 'compras' | 'obrigacoes' | 'financiamentos', id: number) {
    return this.http.post<CompromissoResponses[typeof tipo]>(
      `${this.base}/${caminhos[tipo]}/${id}/cancelar`,
      {},
    );
  }
  contas(pagina: number) {
    return this.http.get<PaginaCompromissos<ContaElegivel>>(`${this.base}/contas`, {
      params: this.parametros(pagina),
    });
  }
  categorias(pagina: number) {
    return this.http.get<PaginaCompromissos<CategoriaElegivel>>(`${this.base}/categorias`, {
      params: this.parametros(pagina),
    });
  }
  meiosPagamento(pagina: number) {
    return this.http.get<PaginaCompromissos<MeioElegivel>>(`${this.base}/meios-pagamento`, {
      params: this.parametros(pagina),
    });
  }
  itens(pagina: number) {
    return this.http.get<PaginaCompromissos<ItemElegivel>>(`${this.base}/itens`, {
      params: this.parametros(pagina),
    });
  }
  faturas(cartaoId: number, pagina: number) {
    return this.http.get<PaginaCompromissos<Fatura>>(`${this.base}/cartoes/${cartaoId}/faturas`, {
      params: this.parametros(pagina),
    });
  }
  fatura(id: number) {
    return this.http.get<DetalheFatura>(`${this.base}/cartoes/faturas/${id}`);
  }
  criarFatura(corpo: FaturaRequest) {
    return this.http.post<Fatura>(`${this.base}/cartoes/faturas`, corpo);
  }
  atualizarFatura(
    id: number,
    corpo: Pick<FaturaRequest, 'dataFechamento' | 'dataVencimento' | 'contaPagamentoId'>,
  ) {
    return this.http.patch<Fatura>(`${this.base}/cartoes/faturas/${id}`, corpo);
  }
  registrarDespesaFatura(id: number, corpo: DespesaFatura) {
    return this.http.post<TransacaoFatura>(`${this.base}/cartoes/faturas/${id}/gastos`, corpo);
  }
  pagarFatura(id: number, corpo: PagamentoFatura, chave: string) {
    return this.http.post<Fatura>(`${this.base}/cartoes/faturas/${id}/pagar`, corpo, {
      headers: new HttpHeaders({ 'Idempotency-Key': chave }),
    });
  }
  executarComandoFatura(id: number, comando: 'fechar' | 'estornar-pagamento' | 'cancelar') {
    return this.http.post<Fatura>(`${this.base}/cartoes/faturas/${id}/${comando}`, {});
  }
  processarCiclosFatura(dataReferencia: string) {
    return this.http.post<CicloFaturas>(`${this.base}/cartoes/faturas/processar-ciclos`, {
      dataReferencia,
    });
  }
  pagarObrigacao(id: number, corpo: PagamentoObrigacaoRequest) {
    return this.http.post<Obrigacao>(`${this.base}/obrigacoes-financeiras/${id}/pagar`, corpo);
  }
  listarPagamentosObrigacao(id: number) {
    return this.http.get<PagamentoObrigacao[]>(
      `${this.base}/obrigacoes-financeiras/${id}/pagamentos`,
    );
  }
  estornarPagamentoObrigacao(id: number, pagamentoId: number | null) {
    const sufixo =
      pagamentoId === null ? 'estornar-pagamento' : `pagamentos/${pagamentoId}/estornar`;
    return this.http.post<Obrigacao>(`${this.base}/obrigacoes-financeiras/${id}/${sufixo}`, {});
  }
  ocorrencias(mes: string) {
    return this.http.get<Ocorrencia[]>(`${this.base}/recorrencias/ocorrencias/${mes}`);
  }
  gerar(mes: string) {
    return this.http.post<Ocorrencia[]>(`${this.base}/recorrencias/geracoes/${mes}`, {});
  }
  realizar(id: number) {
    return this.http.post<Ocorrencia>(`${this.base}/recorrencias/ocorrencias/${id}/realizar`, {});
  }
  parcelas(id: number, pagina: number) {
    return this.http.get<PaginaCompromissos<Parcela>>(
      `${this.base}/financiamentos/${id}/parcelas`,
      { params: this.parametros(pagina) },
    );
  }
  historicoParcelas(id: number, versao: number) {
    return this.http.get<ParcelaHistorica[]>(
      `${this.base}/financiamentos/${id}/cronogramas/${versao}`,
    );
  }
  pagarParcela(id: number, parcelaId: number, dataPagamento: string) {
    return this.http.post<Parcela>(
      `${this.base}/financiamentos/${id}/parcelas/${parcelaId}/pagar`,
      { dataPagamento },
    );
  }
  estornarParcela(id: number, parcelaId: number) {
    return this.http.post<Parcela>(
      `${this.base}/financiamentos/${id}/parcelas/${parcelaId}/estornar-pagamento`,
      {},
    );
  }
  finalizarParcela(id: number, parcelaId: number) {
    return this.http.post<RefinanciamentoParcelas>(
      `${this.base}/financiamentos/${id}/parcelas/${parcelaId}/refinanciamento`,
      {},
    );
  }
  removerParcelaIncorreta(id: number, parcelaId: number) {
    return this.http.delete<Parcela[]>(
      `${this.base}/financiamentos/${id}/parcelas/${parcelaId}/erro-de-lancamento`,
    );
  }
  amortizar(id: number, corpo: AmortizacaoRequest) {
    return this.http.post<Amortizacao>(`${this.base}/financiamentos/${id}/amortizar`, corpo);
  }
  refinanciar(id: number, parcelaId: number, novoFinanciamento: FinanciamentoRequest) {
    return this.http.post<Refinanciamento>(`${this.base}/financiamentos/${id}/refinanciar`, {
      parcelaId,
      novoFinanciamento,
    });
  }
}

export class IntencaoPagamento {
  private payload = '';
  private chave = '';
  obterChave(faturaId: number, corpo: PagamentoFatura): string {
    const payload = JSON.stringify({ faturaId, corpo });
    if (payload !== this.payload || !this.chave) {
      this.payload = payload;
      this.chave = crypto.randomUUID();
    }
    return this.chave;
  }
  concluir() {
    this.payload = '';
    this.chave = '';
  }
}
