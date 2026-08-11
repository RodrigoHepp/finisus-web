import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal, ViewChild } from '@angular/core';
import {
  AbstractControl,
  FormGroupDirective,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { AuthApiService } from '../../../../core/auth/auth-api.service';
import { AvisoCapsLockComponent } from '../../../../shared/ui/aviso-caps-lock/aviso-caps-lock';
import { MensagemGlobalService } from '../../../../shared/ui/mensagem-global/mensagem-global.service';
import { IndicadorProcessamentoComponent } from '../../../../shared/ui/indicador-processamento/indicador-processamento';
import { CampoFormularioComponent } from '../../../../shared/ui/campo-formulario/campo-formulario';

type CampoCadastro = 'nome' | 'email' | 'senha' | 'confirmacaoSenha';
type CampoDeSenha = 'senha' | 'confirmacaoSenha';

@Component({
  selector: 'app-cadastro-usuario',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    TranslatePipe,
    IndicadorProcessamentoComponent,
    CampoFormularioComponent,
    AvisoCapsLockComponent,
  ],
  templateUrl: './cadastro-usuario.html',
  styleUrl: './cadastro-usuario.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CadastroUsuarioPage {
  @ViewChild(FormGroupDirective) private formDirective?: FormGroupDirective;

  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly authApiService = inject(AuthApiService);
  private readonly mensagemGlobalService = inject(MensagemGlobalService);
  private readonly translateService = inject(TranslateService);

  protected readonly formulario = this.formBuilder.group(
    {
      nome: ['', [Validators.required, Validators.maxLength(150)]],
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
      confirmacaoSenha: ['', [Validators.required]],
    },
    {
      validators: senhasCoincidem,
    },
  );

  protected readonly formularioEnviado = signal(false);
  protected readonly carregando = signal(false);
  protected readonly mensagem = signal<string | null>(null);
  protected readonly senhaVisivel = signal(false);
  protected readonly confirmacaoSenhaVisivel = signal(false);
  protected readonly campoComCapsLockAtivo = signal<CampoDeSenha | null>(null);

  protected cadastrar(): void {
    this.mensagem.set(null);
    this.formularioEnviado.set(true);

    if (this.formulario.invalid || this.carregando()) {
      return;
    }

    this.carregando.set(true);

    const { nome, email, senha } = this.formulario.getRawValue();

    this.authApiService
      .cadastrar({ nome, email, senha })
      .pipe(finalize(() => this.carregando.set(false)))
      .subscribe({
        next: (usuario) => {
          this.limparFormulario();
          this.mensagemGlobalService.sucesso(
            this.translateService.instant(
              'AUTENTICACAO.CADASTRO_USUARIO.USUARIO_CADASTRADO_COM_SUCESSO',
              {
                nome: usuario.nome,
              },
            ),
          );
        },
        error: (erro: unknown) => {
          const mensagem = this.obterMensagemDeErro(erro);

          if (this.deveExibirMensagemGlobal(erro)) {
            this.mensagemGlobalService.erro(mensagem);
            return;
          }

          this.mensagem.set(mensagem);
        },
      });
  }

  protected alternarVisibilidadeDaSenha(): void {
    this.senhaVisivel.update((visivel) => !visivel);
  }

  protected limparFormulario(): void {
    this.formDirective?.resetForm();
    this.formularioEnviado.set(false);
    this.mensagem.set(null);
    this.senhaVisivel.set(false);
    this.confirmacaoSenhaVisivel.set(false);
    this.campoComCapsLockAtivo.set(null);
  }

  protected alternarVisibilidadeDaConfirmacao(): void {
    this.confirmacaoSenhaVisivel.update((visivel) => !visivel);
  }

  protected atualizarEstadoDoCapsLock(evento: KeyboardEvent, campo: CampoDeSenha): void {
    this.campoComCapsLockAtivo.set(evento.getModifierState('CapsLock') ? campo : null);
  }

  protected capsLockAtivoNoCampo(campo: CampoDeSenha): boolean {
    return this.campoComCapsLockAtivo() === campo;
  }

  protected ocultarAvisoDoCapsLock(campo: CampoDeSenha): void {
    if (this.campoComCapsLockAtivo() === campo) {
      this.campoComCapsLockAtivo.set(null);
    }
  }

  protected campoInvalido(campo: CampoCadastro): boolean {
    const controle = this.formulario.controls[campo];

    return controle.invalid && this.formularioEnviado();
  }

  protected confirmacaoInvalida(): boolean {
    const confirmacao = this.formulario.controls.confirmacaoSenha;

    return (
      this.formularioEnviado() &&
      (confirmacao.invalid || this.formulario.hasError('senhasDiferentes'))
    );
  }

  private obterMensagemDeErro(erro: unknown): string {
    if (erro instanceof HttpErrorResponse) {
      if (erro.status === 0) {
        return this.translateService.instant('COMPARTILHADO.MENSAGENS.ERRO_CONEXAO_BACKEND');
      }

      if (erro.status === 403) {
        return this.translateService.instant('AUTENTICACAO.CADASTRO_USUARIO.SEM_PERMISSAO');
      }

      if (typeof erro.error?.detail === 'string') {
        return erro.error.detail;
      }
    }

    return this.translateService.instant('AUTENTICACAO.CADASTRO_USUARIO.ERRO');
  }

  private deveExibirMensagemGlobal(erro: unknown): boolean {
    return erro instanceof HttpErrorResponse && (erro.status === 0 || erro.status >= 500);
  }
}

function senhasCoincidem(controle: AbstractControl): ValidationErrors | null {
  const senha = controle.get('senha')?.value;
  const confirmacaoSenha = controle.get('confirmacaoSenha')?.value;

  return senha === confirmacaoSenha ? null : { senhasDiferentes: true };
}
