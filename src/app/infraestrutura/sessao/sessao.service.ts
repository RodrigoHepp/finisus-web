import type { TokensSessao, CadastroUsuario, UsuarioCadastrado } from '../api/contratos-http';
export type { TokensSessao, CadastroUsuario, UsuarioCadastrado } from '../api/contratos-http';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, Observable, of, shareReplay, tap, throwError } from 'rxjs';
import { URL_BASE_API } from '../api/configuracao-api';
import { Permissao, permissoesDoToken } from './permissoes';
export type { Permissao } from './permissoes';

const CHAVE_ARMAZENAMENTO = 'finisus.session';

@Injectable({ providedIn: 'root' })
export class SessaoService {
  private readonly http = inject(HttpClient);
  private readonly urlBase = inject(URL_BASE_API).replace(/\/$/, '');
  private readonly estado = signal<TokensSessao | null>(this.restaurar());
  private renovacao: Observable<TokensSessao> | null = null;
  private geracao = 0;
  readonly tokens = this.estado.asReadonly();
  readonly autenticado = computed(() => this.estado() !== null);
  readonly permissoes = computed(() => permissoesDoToken(this.estado()?.accessToken));

  temPermissao(permissao: Permissao): boolean {
    return this.permissoes().includes(permissao);
  }

  login(credenciais: { email: string; senha: string }): Observable<TokensSessao> {
    const geracao = ++this.geracao;
    return this.http.post<TokensSessao>(`${this.urlBase}/auth/login`, credenciais).pipe(
      tap((tokens) => {
        if (geracao === this.geracao) this.salvar(tokens);
      }),
      catchError((erro: unknown) => {
        if (erro instanceof HttpErrorResponse && erro.status === 423 && geracao === this.geracao)
          this.encerrarSessao();
        return throwError(() => erro);
      }),
    );
  }

  cadastrar(cadastro: CadastroUsuario): Observable<UsuarioCadastrado> {
    return this.http.post<UsuarioCadastrado>(`${this.urlBase}/auth/cadastro`, cadastro);
  }

  garantirAcesso(): Observable<TokensSessao | null> {
    const tokens = this.estado();
    return tokens && Date.parse(tokens.expiraEm) <= Date.now() + 30_000
      ? this.refresh()
      : of(tokens);
  }

  refresh(): Observable<TokensSessao> {
    if (this.renovacao) return this.renovacao;
    const tokens = this.estado();
    if (!tokens) return throwError(() => new Error('Sessão encerrada. Entre novamente.'));
    const geracao = this.geracao;
    this.renovacao = this.http
      .post<TokensSessao>(`${this.urlBase}/auth/refresh`, { refreshToken: tokens.refreshToken })
      .pipe(
        tap((atualizado) => {
          if (geracao !== this.geracao) throw new Error('Sessão encerrada. Entre novamente.');
          this.salvar(atualizado);
        }),
        catchError((erro: unknown) => {
          if (geracao === this.geracao) this.encerrarSessao();
          return throwError(() => erro);
        }),
        finalize(() => {
          this.renovacao = null;
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    return this.renovacao;
  }

  encerrarSessao(): void {
    this.geracao++;
    this.estado.set(null);
    try {
      sessionStorage.removeItem(CHAVE_ARMAZENAMENTO);
    } catch {
      /* O armazenamento pode estar indisponível. */
    }
  }

  private salvar(tokens: TokensSessao): void {
    this.estado.set(tokens);
    try {
      sessionStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(tokens));
    } catch {
      /* Preserva a sessão em memória. */
    }
  }

  private restaurar(): TokensSessao | null {
    try {
      const valor: unknown = JSON.parse(sessionStorage.getItem(CHAVE_ARMAZENAMENTO) ?? 'null');
      if (
        valor &&
        typeof valor === 'object' &&
        'accessToken' in valor &&
        typeof valor.accessToken === 'string' &&
        'refreshToken' in valor &&
        typeof valor.refreshToken === 'string' &&
        'expiraEm' in valor &&
        typeof valor.expiraEm === 'string' &&
        Number.isFinite(Date.parse(valor.expiraEm))
      ) {
        return {
          accessToken: valor.accessToken,
          refreshToken: valor.refreshToken,
          expiraEm: valor.expiraEm,
        };
      }
    } catch {
      /* Uma sessão persistida inválida é ignorada. */
    }
    return null;
  }
}
