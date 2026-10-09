import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { URL_BASE_API } from '../../infraestrutura/api/configuracao-api';
import { UsuarioCadastrado, CadastroUsuario } from '../../infraestrutura/api/contratos-http';

@Injectable({ providedIn: 'root' })
export class AcessoUsuariosApi {
  private readonly http = inject(HttpClient);
  private readonly base = inject(URL_BASE_API).replace(/\/$/, '');
  criar(valor: CadastroUsuario) {
    return this.http.post<UsuarioCadastrado>(`${this.base}/auth/cadastro`, valor);
  }
  desbloquear(usuarioId: number) {
    return this.http.post<void>(`${this.base}/usuarios/${usuarioId}/desbloquear`, null);
  }
}
