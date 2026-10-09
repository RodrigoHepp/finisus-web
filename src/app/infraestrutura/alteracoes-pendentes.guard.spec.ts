import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { of, firstValueFrom } from 'rxjs';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { alteracoesPendentesGuard } from './alteracoes-pendentes.guard';
import { SessaoService } from './sessao/sessao.service';
describe('Saída de jornadas editáveis', () => {
  afterEach(() => vi.restoreAllMocks());
  const verificar = () =>
    TestBed.runInInjectionContext(() =>
      alteracoesPendentesGuard(
        { temAlteracoes: () => true },
        {} as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot,
        {} as RouterStateSnapshot,
      ),
    );
  it('destrói dados da jornada após encerrar sessão sem um segundo pedido de descarte', async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: SessaoService, useValue: { autenticado: () => false } }],
    });
    const confirmacao = vi.spyOn(window, 'confirm').mockReturnValue(false);
    expect(await firstValueFrom(of(verificar()))).toBe(true);
    expect(confirmacao).not.toHaveBeenCalled();
  });
  it('preserva alterações enquanto a sessão estiver válida e o descarte for recusado', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: SessaoService, useValue: { autenticado: () => true } }],
    });
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    expect(verificar()).toBe(false);
  });
});
