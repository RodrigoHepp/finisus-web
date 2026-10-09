import type {
  PaginaHttp,
  Conta,
  ContaRequest,
  Reconciliacao,
  Ajuste,
  TransferenciaRequest,
  Transferencia,
  TransacaoItemRequest,
  TransacaoRequest,
  Transacao,
  Historico,
  TipoCadastro,
  CadastroRequests,
  CadastroResponses,
} from '../../infraestrutura/api/contratos-http';
export type {
  PaginaHttp,
  Banco,
  Categoria,
  Item,
  Meio,
  TipoConta,
  Conta,
  ContaRequest,
  Reconciliacao,
  Ajuste,
  TransferenciaRequest,
  Transferencia,
  TransacaoItemRequest,
  TransacaoRequest,
  Transacao,
  Historico,
  TipoCadastro,
  Cadastro,
  CadastroRequests,
  CadastroResponses,
} from '../../infraestrutura/api/contratos-http';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { URL_BASE_API } from '../../infraestrutura/api/configuracao-api';

@Injectable({ providedIn: 'root' })
export class DiaADiaApi {
  private readonly http = inject(HttpClient);
  private readonly base = inject(URL_BASE_API);
  private pagina(pagina: number, tamanho = 20) {
    return new HttpParams().set('pagina', pagina).set('tamanho', tamanho);
  }
  listarCadastros<K extends TipoCadastro>(tipo: K, pagina: number) {
    return this.http.get<PaginaHttp<CadastroResponses[K]>>(`${this.base}/${tipo}`, {
      params: this.pagina(pagina),
    });
  }
  consultarCadastro<K extends TipoCadastro>(tipo: K, id: number) {
    return this.http.get<CadastroResponses[K]>(`${this.base}/${tipo}/${id}`);
  }
  salvarCadastro<K extends TipoCadastro>(tipo: K, corpo: CadastroRequests[K], id: number | null) {
    return id === null
      ? this.http.post<CadastroResponses[K]>(`${this.base}/${tipo}`, corpo)
      : this.http.patch<CadastroResponses[K]>(`${this.base}/${tipo}/${id}`, corpo);
  }
  inativarCadastro(tipo: TipoCadastro, id: number) {
    return this.http.delete<void>(`${this.base}/${tipo}/${id}`);
  }
  contas(pagina: number) {
    return this.http.get<PaginaHttp<Conta>>(`${this.base}/contas`, { params: this.pagina(pagina) });
  }
  conta(id: number) {
    return this.http.get<Conta>(`${this.base}/contas/${id}`);
  }
  salvarConta(corpo: ContaRequest, id: number | null) {
    return id === null
      ? this.http.post<Conta>(`${this.base}/contas`, corpo)
      : this.http.patch<Conta>(`${this.base}/contas/${id}`, corpo);
  }
  inativarConta(id: number) {
    return this.http.delete<void>(`${this.base}/contas/${id}`);
  }
  reconciliar(id: number) {
    return this.http.get<Reconciliacao>(`${this.base}/contas/${id}/reconciliacao`);
  }
  ajustes(id: number, pagina: number) {
    return this.http.get<PaginaHttp<Ajuste>>(`${this.base}/contas/${id}/ajustes-saldo`, {
      params: this.pagina(pagina),
    });
  }
  ajustar(id: number, corpo: { saldoInformado: number; motivo: string }, chave: string) {
    return this.http.post<Ajuste>(`${this.base}/contas/${id}/ajustes-saldo`, corpo, {
      headers: new HttpHeaders({ 'Idempotency-Key': chave }),
    });
  }
  transferir(corpo: TransferenciaRequest, chave: string) {
    return this.http.post<Transferencia>(`${this.base}/transferencias`, corpo, {
      headers: new HttpHeaders({ 'Idempotency-Key': chave }),
    });
  }
  transferencia(id: number) {
    return this.http.get<Transferencia>(`${this.base}/transferencias/${id}`);
  }
  estornarTransferencia(id: number) {
    return this.http.post<Transferencia>(`${this.base}/transferencias/${id}/estornar`, {});
  }
  transacoes(pagina: number, filtro: { mes: string; tipo: string; categoriaId: number | null }) {
    let parametros = this.pagina(pagina);
    if (filtro.mes) parametros = parametros.set('mes', filtro.mes);
    if (filtro.tipo) parametros = parametros.set('tipo', filtro.tipo);
    if (filtro.categoriaId !== null) parametros = parametros.set('categoriaId', filtro.categoriaId);
    return this.http.get<PaginaHttp<Transacao>>(`${this.base}/transacoes`, { params: parametros });
  }
  transacao(id: number) {
    return this.http.get<Transacao>(`${this.base}/transacoes/${id}`);
  }
  registrar(corpo: TransacaoRequest) {
    return this.http.post<Transacao>(`${this.base}/transacoes`, corpo);
  }
  corrigir(id: number, corpo: TransacaoRequest & { motivo: string }) {
    return this.http.patch<Transacao>(`${this.base}/transacoes/${id}`, corpo);
  }
  detalhar(id: number, itens: TransacaoItemRequest[], motivo: string) {
    return this.http.put<Transacao>(`${this.base}/transacoes/${id}/itens`, { itens, motivo });
  }
  estornar(id: number) {
    return this.http.post<Transacao>(`${this.base}/transacoes/${id}/estorno`, {});
  }
  historico(id: number, pagina: number) {
    return this.http.get<PaginaHttp<Historico>>(`${this.base}/transacoes/${id}/historico`, {
      params: this.pagina(pagina),
    });
  }
}

/** Retém a chave para repetir a mesma intenção após uma falha de rede. */
export class ChaveIntencao {
  private payload = '';
  private chave = '';
  obterChave(corpo: unknown): string {
    const serializado = JSON.stringify(corpo);
    if (serializado !== this.payload || !this.chave) {
      this.payload = serializado;
      this.chave = crypto.randomUUID();
    }
    return this.chave;
  }
  concluir(): void {
    this.payload = '';
    this.chave = '';
  }
}
