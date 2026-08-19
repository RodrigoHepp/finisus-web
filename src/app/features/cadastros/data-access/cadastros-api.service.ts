import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { PaginaResponse, ParametrosPaginacao } from '../../../core/api/paginacao.model';
import { environment } from '../../../environment/environment';
import { ConfiguracaoCadastro, RegistroCadastro, RequisicaoCadastro } from '../cadastros.models';

@Injectable({ providedIn: 'root' })
export class CadastrosApiService {
  private readonly http = inject(HttpClient);

  listar(
    configuracao: ConfiguracaoCadastro,
    parametrosPaginacao: ParametrosPaginacao,
  ): Observable<PaginaResponse<RegistroCadastro>> {
    const params = new HttpParams()
      .set('pagina', parametrosPaginacao.pagina)
      .set('tamanho', parametrosPaginacao.tamanho);

    return this.http.get<PaginaResponse<RegistroCadastro>>(this.url(configuracao), { params });
  }

  buscar(configuracao: ConfiguracaoCadastro, id: number): Observable<RegistroCadastro> {
    return this.http.get<RegistroCadastro>(`${this.url(configuracao)}/${id}`);
  }

  criar(
    configuracao: ConfiguracaoCadastro,
    requisicao: RequisicaoCadastro,
  ): Observable<RegistroCadastro> {
    return this.http.post<RegistroCadastro>(this.url(configuracao), requisicao);
  }

  atualizar(
    configuracao: ConfiguracaoCadastro,
    id: number,
    requisicao: RequisicaoCadastro,
  ): Observable<RegistroCadastro> {
    return this.http.patch<RegistroCadastro>(`${this.url(configuracao)}/${id}`, requisicao);
  }

  inativar(configuracao: ConfiguracaoCadastro, id: number): Observable<void> {
    return this.http.delete<void>(`${this.url(configuracao)}/${id}`);
  }

  private url(configuracao: ConfiguracaoCadastro): string {
    return `${environment.apiUrl}/${configuracao.endpoint}`;
  }
}
