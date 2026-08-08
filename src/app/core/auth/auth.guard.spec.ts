import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { vi } from 'vitest';

import { authGuard } from './auth.guard';
import { AuthService } from './auth.service';

describe('authGuard', () => {
  const router = {
    createUrlTree: vi.fn(() => new UrlTree()),
  };

  beforeEach(() => {
    router.createUrlTree.mockClear();
  });

  it('permite a rota após a sessão ser restaurada', () => {
    configurarTeste(true);
    let resultado: boolean | UrlTree | undefined;

    executarGuard().subscribe((valor) => (resultado = valor));

    expect(resultado).toBe(true);
  });

  it('redireciona ao login quando a sessão não pode ser restaurada', () => {
    configurarTeste(false);
    let resultado: boolean | UrlTree | undefined;

    executarGuard().subscribe((valor) => (resultado = valor));

    expect(router.createUrlTree).toHaveBeenCalledWith(['/login'], {
      queryParams: { retorno: '/dashboard' },
    });
    expect(resultado).toBeInstanceOf(UrlTree);
  });

  function configurarTeste(sessaoPodeSerRestaurada: boolean): void {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: {
            restaurarSessao: () => of(sessaoPodeSerRestaurada),
          },
        },
        {
          provide: Router,
          useValue: router,
        },
      ],
    });
  }

  function executarGuard(): Observable<boolean | UrlTree> {
    return TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/dashboard' } as never),
    ) as Observable<boolean | UrlTree>;
  }
});
