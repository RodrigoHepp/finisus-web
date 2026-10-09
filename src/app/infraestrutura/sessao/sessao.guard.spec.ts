import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { describe, it, expect } from 'vitest';
import { permissaoGuard } from './sessao.guard';
import { SessaoService } from './sessao.service';

describe('Guard de permissão', () => {
  function verificar(
    autenticado: boolean,
    permitido: string[],
    data: Record<string, unknown>,
  ): boolean | UrlTree {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: SessaoService,
          useValue: {
            autenticado: () => autenticado,
            temPermissao: (permissao: string) => permitido.includes(permissao),
          },
        },
      ],
    });
    return TestBed.runInInjectionContext(() =>
      permissaoGuard(
        { data } as ActivatedRouteSnapshot,
        { url: '/usuarios' } as RouterStateSnapshot,
      ),
    ) as boolean | UrlTree;
  }

  it('exige autenticação com retorno para a jornada', () => {
    const resultado = verificar(false, [], { permissoes: ['USUARIO_CADASTRAR'] });
    expect(TestBed.inject(Router).serializeUrl(resultado as UrlTree)).toBe(
      '/entrar?retorno=%2Fusuarios',
    );
  });
  it('aceita qualquer permissão prevista para a rota', () => {
    expect(
      verificar(true, ['USUARIO_DESBLOQUEAR'], {
        permissoes: ['USUARIO_CADASTRAR', 'USUARIO_DESBLOQUEAR'],
      }),
    ).toBe(true);
  });
  it('nega usuário comum e configuração sem permissão', () => {
    const resultado = verificar(true, [], {});
    expect(TestBed.inject(Router).serializeUrl(resultado as UrlTree)).toBe('/visao-geral');
  });
  it('aceita rota com uma permissão específica', () => {
    expect(verificar(true, ['USUARIO_CADASTRAR'], { permissao: 'USUARIO_CADASTRAR' })).toBe(true);
  });
});
