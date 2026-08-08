import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, Observable, shareReplay, switchMap, tap, throwError } from 'rxjs';

import { AuthApiService } from '../../auth/auth-api.service';
import { AuthService } from '../../auth/auth.service';
import { AuthTokens } from '../../auth/auth.models';
import { environment } from '../../../environment/environment';
import { MensagemGlobalService } from '../../../shared/ui/mensagem-global/mensagem-global.service';

let renovacaoEmAndamento: Observable<AuthTokens> | null = null;

export const refreshTokenInterceptor: HttpInterceptorFn = (request, next) => {
  const authApiService = inject(AuthApiService);
  const authService = inject(AuthService);
  const router = inject(Router);
  const mensagemGlobalService = inject(MensagemGlobalService);

  const pertenceApi = request.url.startsWith(environment.apiUrl);

  const rotaLogin = `${environment.apiUrl}/auth/login`;
  const rotaRefresh = `${environment.apiUrl}/auth/refresh`;

  const rotaPublica = request.url === rotaLogin || request.url === rotaRefresh;

  if (!pertenceApi || rotaPublica) {
    return next(request);
  }

  return next(request).pipe(
    catchError((erro: unknown) => {
      if (!(erro instanceof HttpErrorResponse) || erro.status !== 401) {
        return throwError(() => erro);
      }

      return obterRenovacaoDeToken(authApiService, authService, router, mensagemGlobalService).pipe(
        switchMap((tokens) => {
          const requisicaoComNovoToken = request.clone({
            setHeaders: {
              Authorization: `Bearer ${tokens.accessToken}`,
            },
          });

          return next(requisicaoComNovoToken);
        }),
      );
    }),
  );
};

function obterRenovacaoDeToken(
  authApiService: AuthApiService,
  authService: AuthService,
  router: Router,
  mensagemGlobalService: MensagemGlobalService,
): Observable<AuthTokens> {
  const renovacaoExistente = renovacaoEmAndamento;

  if (renovacaoExistente) {
    return renovacaoExistente;
  }

  const refreshToken = authService.refreshToken();

  if (!refreshToken) {
    encerrarSessaoERedirecionar(authService, router, mensagemGlobalService);

    return throwError(() => new Error('Não existe refresh token para renovar a sessão.'));
  }

  const novaRenovacao = authApiService.renovarToken(refreshToken).pipe(
    tap((tokens) => authService.atualizarTokens(tokens)),
    catchError((erro: unknown) => {
      encerrarSessaoERedirecionar(authService, router, mensagemGlobalService);

      return throwError(() => erro);
    }),
    finalize(() => {
      renovacaoEmAndamento = null;
    }),
    shareReplay({
      bufferSize: 1,
      refCount: false,
    }),
  );

  renovacaoEmAndamento = novaRenovacao;

  return novaRenovacao;
}

function encerrarSessaoERedirecionar(
  authService: AuthService,
  router: Router,
  mensagemGlobalService: MensagemGlobalService,
): void {
  const retorno = router.url;

  authService.encerrarSessao();
  mensagemGlobalService.aviso('Sua sessão expirou. Entre novamente.');

  void router.navigate(['/login'], {
    queryParams: {
      retorno,
    },
  });
}
