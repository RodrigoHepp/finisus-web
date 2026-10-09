import type {
  DocumentoImportacao,
  RevisaoImportacao,
  RevisaoImportacaoInput,
} from '../../infraestrutura/api/contratos-http';
export type {
  LancamentoImportado,
  DocumentoImportacao,
  RevisaoImportacao,
  RevisaoImportacaoInput,
} from '../../infraestrutura/api/contratos-http';
import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { URL_BASE_API } from '../../infraestrutura/api/configuracao-api';
import type { TipoDocumentoFinanceiro } from '../../infraestrutura/api/backend.dtos';

@Injectable({ providedIn: 'root' })
export class ImportacoesApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(URL_BASE_API).replace(/\/$/, '')}/importacoes-financeiras`;
  enviarArquivo(
    arquivo: File,
    input: {
      bancoId: number;
      tipoDocumento: TipoDocumentoFinanceiro;
      contaId: number | null;
      faturaId: number | null;
    },
  ) {
    let parametros = new HttpParams()
      .set('bancoId', input.bancoId)
      .set('tipoDocumento', input.tipoDocumento);
    if (input.contaId !== null) parametros = parametros.set('contaId', input.contaId);
    if (input.faturaId !== null) parametros = parametros.set('faturaId', input.faturaId);
    const corpo = new FormData();
    corpo.append('arquivo', arquivo, arquivo.name);
    return this.http.post<RevisaoImportacao>(this.base, corpo, { params: parametros });
  }
  consultar(id: number) {
    return this.http.get<RevisaoImportacao>(`${this.base}/${id}`);
  }
  revisao(id: number, input: RevisaoImportacaoInput) {
    return this.http.put<RevisaoImportacao>(`${this.base}/${id}/revisao`, input);
  }
  confirmar(id: number) {
    return this.http.post<DocumentoImportacao>(`${this.base}/${id}/confirmar`, {});
  }
}
