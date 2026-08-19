import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideTranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { AuthApiService } from '../../../../core/auth/auth-api.service';
import { MensagemGlobalService } from '../../../../shared/ui/mensagem-global/mensagem-global.service';
import { CadastroUsuarioPage } from './cadastro-usuario';

interface PaginaDeCadastroParaTeste {
  formulario: {
    setValue(valor: { nome: string; email: string; senha: string; confirmacaoSenha: string }): void;
    markAsDirty(): void;
    hasError(codigo: string): boolean;
  };
  cadastrar(): void;
}

describe('CadastroUsuarioPage', () => {
  let component: CadastroUsuarioPage;
  let fixture: ComponentFixture<CadastroUsuarioPage>;
  let authApiService: { cadastrar: ReturnType<typeof vi.fn> };
  let mensagemGlobalService: { sucesso: ReturnType<typeof vi.fn>; erro: ReturnType<typeof vi.fn> };
  let dialog: { open: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    authApiService = {
      cadastrar: vi.fn(),
    };
    mensagemGlobalService = {
      sucesso: vi.fn(),
      erro: vi.fn(),
    };
    dialog = {
      open: vi.fn(() => ({ afterClosed: () => of(true) })),
    };

    await TestBed.configureTestingModule({
      imports: [CadastroUsuarioPage],
      providers: [
        provideTranslateService(),
        {
          provide: AuthApiService,
          useValue: authApiService,
        },
        {
          provide: MensagemGlobalService,
          useValue: mensagemGlobalService,
        },
        {
          provide: MatDialog,
          useValue: dialog,
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
      'AUTENTICACAO.CADASTRO_USUARIO.USUARIO_CADASTRADO_COM_SUCESSO',
    );
  });

  it('limpa o formulário sem enviar uma requisição', () => {
    preencherFormulario();
    pagina().formulario.markAsDirty();
    fixture.detectChanges();

    const botaoLimpar = fixture.nativeElement.querySelector(
      '.cadastro-formulario__acoes button[type="button"]',
    ) as HTMLButtonElement;

    botaoLimpar.click();
    fixture.detectChanges();

    expect(authApiService.cadastrar).not.toHaveBeenCalled();
    expect(dialog.open).toHaveBeenCalledOnce();
    expect(fixture.nativeElement.querySelector('input[formcontrolname="nome"]')?.value).toBe('');
    expect(
      fixture.nativeElement.querySelector('input[formcontrolname="confirmacaoSenha"]')?.value,
    ).toBe('');
  });

  it('organiza os campos em uma grade e apresenta ações de limpar e salvar', () => {
    expect(fixture.nativeElement.querySelector('mat-card')).toBeNull();
    expect(fixture.nativeElement.querySelector('.cadastro-formulario__campos')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain(
      'AUTENTICACAO.CADASTRO_USUARIO.SECOES.IDENTIFICACAO.TITULO',
    );
    expect(fixture.nativeElement.textContent).toContain(
      'AUTENTICACAO.CADASTRO_USUARIO.SECOES.ACESSO.TITULO',
    );

    const acoes = fixture.nativeElement.querySelector('.cadastro-formulario__acoes');
    expect(acoes?.textContent).toContain('COMPARTILHADO.ACOES.LIMPAR');
    expect(acoes?.textContent).toContain('COMPARTILHADO.ACOES.SALVAR');
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

    expect(fixture.nativeElement.textContent).toContain('AUTENTICACAO.LOGIN.CAPS_LOCK_ATIVO');

    campoSenha?.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('AUTENTICACAO.LOGIN.CAPS_LOCK_ATIVO');
  });

  it('apresenta rótulos externos, obrigatoriedade e placeholders nos campos', () => {
    const rotulos = fixture.nativeElement.querySelectorAll('label[for]');
    const campos = fixture.nativeElement.querySelectorAll('input[formcontrolname]');

    expect(rotulos).toHaveLength(4);
    expect(fixture.nativeElement.querySelectorAll('.campo-formulario__obrigatorio')).toHaveLength(
      4,
    );
    expect(campos[0].getAttribute('placeholder')).toBe('COMPARTILHADO.CAMPOS.EXEMPLO_NOME');
    expect(campos[2].getAttribute('placeholder')).toBe('COMPARTILHADO.CAMPOS.DICA_SENHA_CADASTRO');
  });

  it('alterna senha e confirmação de forma independente sem exibir erro antes do envio', () => {
    const campoSenha = fixture.nativeElement.querySelector(
      'input[formcontrolname="senha"]',
    ) as HTMLInputElement;
    const campoConfirmacao = fixture.nativeElement.querySelector(
      'input[formcontrolname="confirmacaoSenha"]',
    ) as HTMLInputElement;
    const botoesVisibilidade = fixture.nativeElement.querySelectorAll(
      'button[mat-icon-button]',
    ) as NodeListOf<HTMLButtonElement>;

    botoesVisibilidade[0].click();
    fixture.detectChanges();

    expect(campoSenha.type).toBe('text');
    expect(campoConfirmacao.type).toBe('password');
    expect(fixture.nativeElement.querySelector('mat-error')).toBeNull();

    botoesVisibilidade[1].click();
    fixture.detectChanges();

    expect(campoConfirmacao.type).toBe('text');
    expect(botoesVisibilidade[1].getAttribute('aria-pressed')).toBe('true');
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
