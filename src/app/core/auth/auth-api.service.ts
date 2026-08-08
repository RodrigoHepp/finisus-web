import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environment/environment';
import {
  AuthTokens,
  CadastroRequest,
  LoginRequest,
  UsuarioCadastrado,
  UsuarioLogado,
} from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly authUrl = `${environment.apiUrl}/auth`;
  private readonly usuariosUrl = `${environment.apiUrl}/usuarios`;

  cadastrar(request: CadastroRequest): Observable<UsuarioCadastrado> {
    return this.http.post<UsuarioCadastrado>(`${this.authUrl}/cadastro`, request);
  }

  login(request: LoginRequest): Observable<AuthTokens> {
    return this.http.post<AuthTokens>(`${this.authUrl}/login`, request);
  }

  renovarToken(refreshToken: string): Observable<AuthTokens> {
    return this.http.post<AuthTokens>(`${this.authUrl}/refresh`, {
      refreshToken,
    });
  }

  obterUsuarioLogado(): Observable<UsuarioLogado> {
    return this.http.get<UsuarioLogado>(`${this.usuariosUrl}/me`);
  }
}
