import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormGroupDirective,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { AuthApiService } from '../../../../core/auth/auth-api.service';
import { AvisoCapsLockComponent } from '../../../../shared/ui/aviso-caps-lock/aviso-caps-lock';
import { MensagemGlobalService } from '../../../../shared/ui/mensagem-global/mensagem-global.service';
import { IndicadorProcessamentoComponent } from '../../../../shared/ui/indicador-processamento/indicador-processamento';
import { CampoFormularioComponent } from '../../../../shared/ui/campo-formulario/campo-formulario';
import { FocoAcessivelService } from '../../../../shared/ui/foco/foco-acessivel.service';
import {
  ConfirmacaoDialogComponent,
  ConfirmacaoDialogData,
} from '../../../../shared/ui/confirmacao/confirmacao-dialog';
import { PageHeaderComponent } from '../../../../shared/ui/page-header/page-header';
import { senhasCoincidem } from './cadastro-usuario.validators';

type CampoCadastro = 'nome' | 'email' | 'senha' | 'confirmacaoSenha';
type CampoDeSenha = 'senha' | 'confirmacaoSenha';

interface ControlesCadastroUsuario {
  readonly nome: FormControl<string>;
  readonly email: FormControl<string>;
  readonly senha: FormControl<string>;
  readonly confirmacaoSenha: FormControl<string>;
}

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
    PageHeaderComponent,
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
  private readonly focoAcessivelService = inject(FocoAcessivelService);
  private readonly translateService = inject(TranslateService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly formulario: FormGroup<ControlesCadastroUsuario> = this.formBuilder.group(
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

    if (this.carregando()) {
      return;
    }

    if (this.formulario.invalid) {
      this.focarPrimeiroCampoInvalido();
      return;
    }

    this.carregando.set(true);

    const { nome, email, senha } = this.formulario.getRawValue();

    this.authApiService
      .cadastrar({ nome, email, senha })
      .pipe(
        finalize(() => this.carregando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
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

  protected confirmarLimpeza(): void {
    if (!this.formulario.dirty || this.carregando()) {
      return;
    }

    const dados: ConfirmacaoDialogData = {
      titulo: this.translateService.instant(
        'AUTENTICACAO.CADASTRO_USUARIO.CONFIRMACAO_LIMPEZA.TITULO',
      ),
      mensagem: this.translateService.instant(
        'AUTENTICACAO.CADASTRO_USUARIO.CONFIRMACAO_LIMPEZA.MENSAGEM',
      ),
      rotuloConfirmar: this.translateService.instant(
        'AUTENTICACAO.CADASTRO_USUARIO.CONFIRMACAO_LIMPEZA.CONFIRMAR',
      ),
      rotuloCancelar: this.translateService.instant('COMPARTILHADO.ACOES.CANCELAR'),
    };

    this.dialog
      .open(ConfirmacaoDialogComponent, {
        data: dados,
        autoFocus: 'dialog',
        panelClass: 'finisus-dialog',
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmado: boolean | undefined) => {
        if (confirmado) {
          this.limparFormulario();
        }
      });
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

  private focarPrimeiroCampoInvalido(): void {
    const campos: readonly CampoCadastro[] = ['nome', 'email', 'senha', 'confirmacaoSenha'];
    const primeiroCampoInvalido = campos.find(
      (campo) =>
        this.formulario.controls[campo].invalid ||
        (campo === 'confirmacaoSenha' && this.formulario.hasError('senhasDiferentes')),
    );

    if (!primeiroCampoInvalido) {
      return;
    }

    const idPorCampo: Readonly<Record<CampoCadastro, string>> = {
      nome: 'cadastro-nome',
      email: 'cadastro-email',
      senha: 'cadastro-senha',
      confirmacaoSenha: 'cadastro-confirmacao-senha',
    };
    this.focoAcessivelService.focarPorId(idPorCampo[primeiroCampoInvalido]);
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
