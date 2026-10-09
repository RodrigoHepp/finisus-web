import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { throwError } from 'rxjs';
import { SessaoService } from '../../infraestrutura/sessao/sessao.service';
import { SessaoPage } from './sessao.page';

describe('Entrada pública', () => {
  it('login bloqueado mostra orientação manual e não tenta criar usuário', () => {
    const login = vi.fn(() => throwError(() => new HttpErrorResponse({ status: 423 })));
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: SessaoService, useValue: { login } }],
    });
    const fixture = TestBed.createComponent(SessaoPage);
    const pagina = fixture.componentInstance;
    pagina.formulario.setValue({ email: 'teste@example.test', senha: 'SenhaTeste123' });
    pagina.enviar();
    expect(login).toHaveBeenCalledOnce();
    expect(pagina.erro()).toContain('bloqueado');
    expect(pagina.ocupado()).toBe(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('a[href="/cadastro"]')).toBeNull();
  });
  it('403 informa falta de permissão', () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: SessaoService,
          useValue: { login: () => throwError(() => new HttpErrorResponse({ status: 403 })) },
        },
      ],
    });
    const pagina = TestBed.createComponent(SessaoPage).componentInstance;
    pagina.formulario.setValue({ email: 'teste@example.test', senha: 'SenhaTeste123' });
    pagina.enviar();
    expect(pagina.erro()).toContain('permissão');
  });
});
