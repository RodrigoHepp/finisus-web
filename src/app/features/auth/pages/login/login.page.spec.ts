import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { throwError } from 'rxjs';
import { vi } from 'vitest';

import { AuthApiService } from '../../../../core/auth/auth-api.service';
import { FocoAcessivelService } from '../../../../core/accessibility/foco-acessivel.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { MensagemGlobalService } from '../../../../core/feedback/mensagem-global.service';
import { LoginPage } from './login.page';

interface PaginaLoginParaTeste {
  formulario: {
    setValue(valor: { email: string; senha: string }): void;
  };
  enviar(): void;
}

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;
  let authApiService: { login: ReturnType<typeof vi.fn> };
  let focoAcessivelService: { focarPorId: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    authApiService = { login: vi.fn() };
    focoAcessivelService = { focarPorId: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        provideTranslateService(),
        {
          provide: AuthApiService,
          useValue: authApiService,
        },
        {
          provide: AuthService,
          useValue: { iniciarSessao: vi.fn() },
        },
        {
          provide: MensagemGlobalService,
          useValue: { erro: vi.fn() },
        },
        {
          provide: FocoAcessivelService,
          useValue: focoAcessivelService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('deve ser criado', () => {
    expect(component).toBeTruthy();
  });

  it('exibe e oculta o aviso de Caps Lock ao digitar a senha', () => {
    const campoSenha = fixture.nativeElement.querySelector(
      'input[formcontrolname="senha"]',
    ) as HTMLInputElement | null;

    campoSenha?.dispatchEvent(eventoDeTecladoComCapsLockAtivo());
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('AUTENTICACAO.LOGIN.CAPS_LOCK_ATIVO');

    campoSenha?.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('AUTENTICACAO.LOGIN.CAPS_LOCK_ATIVO');
  });

  it('só mostra a obrigatoriedade depois de enviar o formulário', () => {
    const campoSenha = fixture.nativeElement.querySelector(
      'input[formcontrolname="senha"]',
    ) as HTMLInputElement;

    campoSenha.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('mat-error')).toBeNull();

    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('mat-error')).not.toBeNull();
  });

  it('foca o primeiro campo inválido ao enviar', () => {
    pagina().enviar();

    expect(focoAcessivelService.focarPorId).toHaveBeenCalledWith('login-email');
    expect(authApiService.login).not.toHaveBeenCalled();
  });

  it('alterna a visibilidade da senha sem disparar erro antes do envio', () => {
    const campoSenha = fixture.nativeElement.querySelector(
      'input[formcontrolname="senha"]',
    ) as HTMLInputElement;
    const botaoVisibilidade = fixture.nativeElement.querySelector(
      'button[mat-icon-button]',
    ) as HTMLButtonElement;

    expect(campoSenha.type).toBe('password');

    botaoVisibilidade.click();
    fixture.detectChanges();

    expect(campoSenha.type).toBe('text');
    expect(botaoVisibilidade.getAttribute('aria-pressed')).toBe('true');
    expect(fixture.nativeElement.querySelector('mat-error')).toBeNull();
  });

  it('apresenta o detalhe do ProblemDetail devolvido pelo backend no erro 422', () => {
    authApiService.login.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 422,
            error: { detail: 'O e-mail informado não está ativo.' },
          }),
      ),
    );
    pagina().formulario.setValue({
      email: 'ana@example.com',
      senha: 'senha-segura',
    });

    pagina().enviar();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('O e-mail informado não está ativo.');
  });

  function pagina(): PaginaLoginParaTeste {
    return component as unknown as PaginaLoginParaTeste;
  }
});

function eventoDeTecladoComCapsLockAtivo(): KeyboardEvent {
  const evento = new KeyboardEvent('keyup');

  Object.defineProperty(evento, 'getModifierState', {
    value: (modificador: string) => modificador === 'CapsLock',
  });

  return evento;
}
