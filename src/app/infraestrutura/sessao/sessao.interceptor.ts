import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, of, switchMap, throwError } from 'rxjs';
import { URL_BASE_API } from '../api/configuracao-api';
import { SessaoService } from './sessao.service';

export const sessaoInterceptor: HttpInterceptorFn = (requisicao, next) => {
  const base = inject(URL_BASE_API).replace(/\/$/, '');
  if (
    !(requisicao.url === base || requisicao.url.startsWith(`${base}/`)) ||
    [`${base}/auth/login`, `${base}/auth/refresh`].includes(requisicao.url.split('?')[0])
  )
    return next(requisicao);
  const sessao = inject(SessaoService);
  return sessao.garantirAcesso().pipe(
    switchMap((tokens) => {
      const requisicaoAutorizada = tokens
        ? requisicao.clone({ setHeaders: { Authorization: `Bearer ${tokens.accessToken}` } })
        : requisicao;
      return next(requisicaoAutorizada).pipe(
        catchError((erro: unknown) => {
          if (erro instanceof HttpErrorResponse && erro.status === 423) {
            if (tokens && sessao.tokens()?.accessToken === tokens.accessToken)
              sessao.encerrarSessao();
            return throwError(() => erro);
          }
          if (!(erro instanceof HttpErrorResponse) || erro.status !== 401 || !tokens)
            return throwError(() => erro);
          // Um comando financeiro desconhecido nunca deve ser repetido automaticamente.
          if (!['GET', 'HEAD'].includes(requisicao.method)) {
            if (sessao.tokens()?.accessToken === tokens.accessToken) sessao.encerrarSessao();
            return throwError(() => erro);
          }
          const atual = sessao.tokens();
          const renovacao =
            atual && atual.accessToken !== tokens.accessToken ? of(atual) : sessao.refresh();
          return renovacao.pipe(
            switchMap((atualizado) =>
              next(
                requisicao.clone({
                  setHeaders: { Authorization: `Bearer ${atualizado.accessToken}` },
                }),
              ).pipe(
                catchError((erroNovaTentativa: unknown) => {
                  if (
                    erroNovaTentativa instanceof HttpErrorResponse &&
                    [401, 423].includes(erroNovaTentativa.status) &&
                    sessao.tokens()?.accessToken === atualizado.accessToken
                  )
                    sessao.encerrarSessao();
                  return throwError(() => erroNovaTentativa);
                }),
              ),
            ),
          );
        }),
      );
    }),
  );
};
