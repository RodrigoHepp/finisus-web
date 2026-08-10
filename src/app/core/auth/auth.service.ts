import { computed, Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { catchError, finalize, map, Observable, of, shareReplay, throwError } from 'rxjs';

import { AuthApiService } from './auth-api.service';
import { AuthStorageService } from './auth-storage.service';
import { AuthTokens, Sessao, UsuarioLogado } from './auth.models';
import { ProcessamentoGlobalService } from '../processamento/processamento-global.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authApiService = inject(AuthApiService);
  private readonly authStorageService = inject(AuthStorageService);
  private readonly processamentoGlobalService = inject(ProcessamentoGlobalService);
  private readonly translateService = inject(TranslateService);

  private readonly sessaoPersistida = this.authStorageService.obterSessao();

  private readonly tokensAtuais = signal<AuthTokens | null>(this.sessaoPersistida?.tokens ?? null);

  private readonly usuarioAtual = signal<UsuarioLogado | null>(
    this.sessaoPersistida?.usuario ?? null,
  );

  private readonly sessaoConfirmada = signal(false);
  private restauracaoEmAndamento: Observable<boolean> | null = null;

  readonly accessToken = computed(() => this.tokensAtuais()?.accessToken ?? null);

  readonly refreshToken = computed(() => this.tokensAtuais()?.refreshToken ?? null);

  readonly usuario = computed(() => this.usuarioAtual());

  readonly sessao = computed<Sessao | null>(() => {
    const tokens = this.tokensAtuais();
    const usuario = this.usuarioAtual();

    if (!tokens || !usuario) {
      return null;
    }

    return {
      tokens,
      usuario,
    };
  });

  readonly estaAutenticado = computed(() => this.sessaoConfirmada() && this.sessao() !== null);

  readonly carregandoUsuario = computed(
    () => this.tokensAtuais() !== null && this.usuarioAtual() === null,
  );

  iniciarSessao(tokens: AuthTokens): Observable<UsuarioLogado> {
    this.tokensAtuais.set(tokens);
    this.usuarioAtual.set(null);
    this.sessaoConfirmada.set(false);
    this.authStorageService.limparSessao();

    return this.authApiService.obterUsuarioLogado().pipe(
      catchError((erro: unknown) => {
        this.encerrarSessao();

        return throwError(() => erro);
      }),
    );
  }

  concluirSessao(usuario: UsuarioLogado): void {
    this.usuarioAtual.set(usuario);
    this.sessaoConfirmada.set(true);
    this.persistirSessao();
  }

  restaurarSessao(): Observable<boolean> {
    if (this.estaAutenticado()) {
      return of(true);
    }

    if (!this.sessao()) {
      return of(false);
    }

    if (this.restauracaoEmAndamento) {
      return this.restauracaoEmAndamento;
    }

    const encerrarProcessamento = this.processamentoGlobalService.iniciar(
      this.translateService.instant('AUTENTICACAO.SESSAO.RESTAURANDO'),
    );

    const restauracao = this.authApiService.obterUsuarioLogado().pipe(
      map((usuario) => {
        this.concluirSessao(usuario);
        return true;
      }),
      catchError(() => {
        this.encerrarSessao();
        return of(false);
      }),
      finalize(() => {
        this.restauracaoEmAndamento = null;
        encerrarProcessamento();
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    this.restauracaoEmAndamento = restauracao;

    return restauracao;
  }

  atualizarTokens(tokens: AuthTokens): void {
    this.tokensAtuais.set(tokens);
    this.persistirSessao();
  }

  encerrarSessao(): void {
    this.tokensAtuais.set(null);
    this.usuarioAtual.set(null);
    this.sessaoConfirmada.set(false);
    this.authStorageService.limparSessao();
  }

  private persistirSessao(): void {
    const sessao = this.sessao();

    if (sessao && this.sessaoConfirmada()) {
      this.authStorageService.salvarSessao(sessao);
    }
  }
}
