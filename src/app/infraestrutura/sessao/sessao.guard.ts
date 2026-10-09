import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessaoService } from './sessao.service';
import { ehPermissao } from './permissoes';

export const sessaoGuard: CanActivateFn = (_rota, estado) =>
  inject(SessaoService).autenticado() ||
  inject(Router).createUrlTree(['/entrar'], { queryParams: { retorno: estado.url } });

export const permissaoGuard: CanActivateFn = (rota, estado) => {
  const sessao = inject(SessaoService);
  const router = inject(Router);
  if (!sessao.autenticado())
    return router.createUrlTree(['/entrar'], { queryParams: { retorno: estado.url } });
  const permissao: unknown = rota.data['permissao'];
  const permissoes: unknown = rota.data['permissoes'];
  return (
    (Array.isArray(permissoes)
      ? permissoes.some((item: unknown) => ehPermissao(item) && sessao.temPermissao(item))
      : ehPermissao(permissao) && sessao.temPermissao(permissao)) ||
    router.createUrlTree(['/visao-geral'])
  );
};
