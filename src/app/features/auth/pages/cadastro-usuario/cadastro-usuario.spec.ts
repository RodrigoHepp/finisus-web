import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { AuthApiService } from '../../../../core/auth/auth-api.service';
import { MensagemGlobalService } from '../../../../shared/ui/mensagem-global/mensagem-global.service';
import { CadastroUsuarioPage } from './cadastro-usuario';

interface PaginaDeCadastroParaTeste {
  formulario: {
    setValue(valor: { nome: string; email: string; senha: string; confirmacaoSenha: string }): void;
    hasError(codigo: string): boolean;
  };
  cadastrar(): void;
}

describe('CadastroUsuarioPage', () => {
  let component: CadastroUsuarioPage;
  let fixture: ComponentFixture<CadastroUsuarioPage>;
  let authApiService: { cadastrar: ReturnType<typeof vi.fn> };
  let mensagemGlobalService: { sucesso: ReturnType<typeof vi.fn>; erro: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    authApiService = {
      cadastrar: vi.fn(),
    };
    mensagemGlobalService = {
      sucesso: vi.fn(),
      erro: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [CadastroUsuarioPage],
      providers: [
        {
          provide: AuthApiService,
          useValue: authApiService,
        },
        {
          provide: MensagemGlobalService,
          useValue: mensagemGlobalService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CadastroUsuarioPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('não envia um formulário inválido', () => {
    pagina().cadastrar();

    expect(authApiService.cadastrar).not.toHaveBeenCalled();
  });

  it('não envia quando as senhas são diferentes', () => {
    preencherFormulario({ confirmacaoSenha: 'outra-senha' });

    pagina().cadastrar();

    expect(pagina().formulario.hasError('senhasDiferentes')).toBe(true);
    expect(authApiService.cadastrar).not.toHaveBeenCalled();
  });

  it('cadastra o usuário e exibe uma mensagem global de sucesso', () => {
    authApiService.cadastrar.mockReturnValue(
      of({
        id: 1,
        nome: 'Ana Silva',
        email: 'ana@example.com',
      }),
    );
    preencherFormulario();

    pagina().cadastrar();
    fixture.detectChanges();

    expect(authApiService.cadastrar).toHaveBeenCalledWith({
      nome: 'Ana Silva',
      email: 'ana@example.com',
      senha: 'senha-segura',
    });
    expect(mensagemGlobalService.sucesso).toHaveBeenCalledWith(
      'Usuário Ana Silva cadastrado com sucesso.',
    );
  });

  it('apresenta o detalhe retornado pelo backend', () => {
    authApiService.cadastrar.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: {
              detail: 'Já existe um usuário com este e-mail.',
            },
          }),
      ),
    );
    preencherFormulario();

    pagina().cadastrar();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Já existe um usuário com este e-mail.');
  });

  it('exibe o aviso de Caps Lock somente junto ao campo de senha em foco', () => {
    const campoSenha = fixture.nativeElement.querySelector(
      'input[formcontrolname="senha"]',
    ) as HTMLInputElement | null;

    campoSenha?.dispatchEvent(eventoDeTecladoComCapsLockAtivo());
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Caps Lock está ativado.');

    campoSenha?.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Caps Lock está ativado.');
  });

  function pagina(): PaginaDeCadastroParaTeste {
    return component as unknown as PaginaDeCadastroParaTeste;
  }

  function preencherFormulario(
    sobrescritas: Partial<{
      nome: string;
      email: string;
      senha: string;
      confirmacaoSenha: string;
    }> = {},
  ): void {
    pagina().formulario.setValue({
      nome: 'Ana Silva',
      email: 'ana@example.com',
      senha: 'senha-segura',
      confirmacaoSenha: 'senha-segura',
      ...sobrescritas,
    });
  }
});

function eventoDeTecladoComCapsLockAtivo(): KeyboardEvent {
  const evento = new KeyboardEvent('keyup');

  Object.defineProperty(evento, 'getModifierState', {
    value: (modificador: string) => modificador === 'CapsLock',
  });

  return evento;
}
