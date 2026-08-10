import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { vi } from 'vitest';

import { MensagemGlobalService } from '../../../../shared/ui/mensagem-global/mensagem-global.service';
import { LoginPage } from './login.page';

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        provideTranslateService(),
        {
          provide: MensagemGlobalService,
          useValue: { erro: vi.fn() },
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
});

function eventoDeTecladoComCapsLockAtivo(): KeyboardEvent {
  const evento = new KeyboardEvent('keyup');

  Object.defineProperty(evento, 'getModifierState', {
    value: (modificador: string) => modificador === 'CapsLock',
  });

  return evento;
}
