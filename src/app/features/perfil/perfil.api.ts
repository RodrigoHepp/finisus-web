import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { URL_BASE_API } from '../../infraestrutura/api/configuracao-api';
import {
  PerfilUsuarioExportacaoResponse,
  PerfilUsuarioRequest,
  PerfilUsuarioResponse,
  PerfilUsuarioSolicitacaoResponse,
} from '../../infraestrutura/api/backend.dtos';
@Injectable({ providedIn: 'root' })
export class PerfilApi {
  private readonly http = inject(HttpClient);
  private readonly base = inject(URL_BASE_API);
  consultar() {
    return this.http.get<PerfilUsuarioResponse>(`${this.base}/usuarios/me`);
  }
  atualizar(valor: PerfilUsuarioRequest) {
    return this.http.patch<PerfilUsuarioResponse>(`${this.base}/usuarios/me`, valor);
  }
  inativar() {
    return this.http.delete<void>(`${this.base}/usuarios/me`);
  }
  exportar() {
    return this.http.get<PerfilUsuarioExportacaoResponse>(`${this.base}/usuarios/me/dados`);
  }
  solicitacoes() {
    return this.http.get<PerfilUsuarioSolicitacaoResponse[]>(
      `${this.base}/usuarios/me/solicitacoes-privacidade`,
    );
  }
  solicitarAnonimizacao(motivo: string) {
    return this.http.post<PerfilUsuarioSolicitacaoResponse>(
      `${this.base}/usuarios/me/solicitacoes-anonimizacao`,
      { motivo },
    );
  }
  consultarPreferencia() {
    return this.http.get<{ aceita: boolean }>(`${this.base}/compartilhamentos/opt-in`);
  }
  atualizarPreferencia(aceita: boolean) {
    return this.http.put<{ aceita: boolean }>(`${this.base}/compartilhamentos/opt-in`, { aceita });
  }
}
