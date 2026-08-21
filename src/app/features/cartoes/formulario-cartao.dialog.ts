import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs';

import { FocoAcessivelService } from '../../core/accessibility/foco-acessivel.service';
import { MensagemGlobalService } from '../../core/feedback/mensagem-global.service';
import { validarTextoObrigatorio } from '../../shared/forms/texto-obrigatorio.validators';
import { CampoFormularioComponent } from '../../shared/ui/campo-formulario/campo-formulario';
import { CabecalhoDialogoFormularioComponent } from '../../shared/ui/cabecalho-dialogo-formulario/cabecalho-dialogo-formulario';
import { MensagemValidacaoComponent } from '../../shared/ui/mensagem-validacao/mensagem-validacao';
import {
  converterDecimalParaNumero,
  formatarDecimalParaCampo,
  validarDecimalPositivo,
} from '../../shared/forms/decimal.validators';
import {
  ConfirmacaoDialogComponent,
  ConfirmacaoDialogData,
} from '../../shared/ui/confirmacao/confirmacao-dialog';
import { Cartao, CartaoRequest } from './cartao.model';
import { CartoesApiService } from './cartoes-api.service';

export interface DadosFormularioCartao {
  readonly cartao?: Cartao;
}
interface ControlesFormularioCartao {
  readonly nome: FormControl<string>;
  readonly limite: FormControl<string>;
  readonly diaFechamento: FormControl<number | null>;
  readonly diaVencimento: FormControl<number | null>;
}

@Component({
  selector: 'app-formulario-cartao-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    TranslatePipe,
    CampoFormularioComponent,
    CabecalhoDialogoFormularioComponent,
    MensagemValidacaoComponent,
  ],
  templateUrl: './formulario-cartao.dialog.html',
  styleUrl: './formulario-cartao.dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormularioCartaoDialogComponent {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly api = inject(CartoesApiService);
  private readonly foco = inject(FocoAcessivelService);
  private readonly mensagens = inject(MensagemGlobalService);
  private readonly dialog = inject(MatDialog);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dados = inject<DadosFormularioCartao>(MAT_DIALOG_DATA);
  protected readonly dialogRef = inject(MatDialogRef<FormularioCartaoDialogComponent>);
  protected readonly enviando = signal(false);
  protected readonly enviado = signal(false);
  protected readonly mensagem = signal<string | null>(null);
  protected readonly editando = this.dados.cartao !== undefined;
  protected readonly formulario: FormGroup<ControlesFormularioCartao> = this.formBuilder.group({
    nome: this.formBuilder.control(this.dados.cartao?.nome ?? '', [
      Validators.required,
      validarTextoObrigatorio(),
      Validators.maxLength(100),
    ]),
    limite: this.formBuilder.control(
      this.dados.cartao ? formatarDecimalParaCampo(this.dados.cartao.limite) : '',
      [Validators.required, validarDecimalPositivo()],
    ),
    diaFechamento: this.formBuilder.control<number | null>(
      this.dados.cartao?.diaFechamento ?? null,
      [Validators.required, Validators.min(1), Validators.max(31)],
    ),
    diaVencimento: this.formBuilder.control<number | null>(
      this.dados.cartao?.diaVencimento ?? null,
      [Validators.required, Validators.min(1), Validators.max(31)],
    ),
  });
  protected salvar(): void {
    this.enviado.set(true);
    this.mensagem.set(null);
    if (this.formulario.invalid || this.enviando()) {
      this.focarPrimeiroInvalido();
      return;
    }
    const valores = this.formulario.getRawValue();
    if (valores.diaFechamento === null || valores.diaVencimento === null) {
      return;
    }
    const limite = converterDecimalParaNumero(valores.limite);
    if (limite === null) {
      this.mensagem.set(this.translate.instant('CARTOES.VALIDACOES.LIMITE'));
      return;
    }
    const requisicao: CartaoRequest = {
      nome: valores.nome.trim(),
      limite,
      diaFechamento: valores.diaFechamento,
      diaVencimento: valores.diaVencimento,
    };
    const operacao = this.dados.cartao
      ? this.api.atualizar(this.dados.cartao.id, requisicao)
      : this.api.criar(requisicao);
    this.enviando.set(true);
    operacao
      .pipe(
        finalize(() => this.enviando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (cartao) => {
          this.mensagens.sucesso(
            this.translate.instant(
              this.dados.cartao
                ? 'CADASTROS.MENSAGENS.ATUALIZADO_COM_SUCESSO'
                : 'CADASTROS.MENSAGENS.CRIADO_COM_SUCESSO',
              { nome: cartao.nome },
            ),
          );
          this.dialogRef.close(true);
        },
        error: (erro: unknown) => this.mensagem.set(this.mensagemDeErro(erro)),
      });
  }
  protected cancelar(): void {
    if (!this.formulario.dirty) {
      this.dialogRef.close(false);
      return;
    }
    const dados: ConfirmacaoDialogData = {
      titulo: this.translate.instant('CADASTROS.CONFIRMACAO_DESCARTE.TITULO'),
      mensagem: this.translate.instant('CADASTROS.CONFIRMACAO_DESCARTE.MENSAGEM'),
      rotuloConfirmar: this.translate.instant('CADASTROS.CONFIRMACAO_DESCARTE.CONFIRMAR'),
      rotuloCancelar: this.translate.instant('COMPARTILHADO.ACOES.CANCELAR'),
      tom: 'perigoso',
    };
    this.dialog
      .open(ConfirmacaoDialogComponent, { data: dados, panelClass: 'finisus-dialog' })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmado: boolean | undefined) => {
        if (confirmado) {
          this.dialogRef.close(false);
        }
      });
  }
  protected campoInvalido(nome: keyof ControlesFormularioCartao): boolean {
    return this.enviado() && this.formulario.controls[nome].invalid;
  }
  private focarPrimeiroInvalido(): void {
    const nome = (
      Object.keys(this.formulario.controls) as (keyof ControlesFormularioCartao)[]
    ).find((campo) => this.formulario.controls[campo].invalid);
    if (nome) {
      this.foco.focarPorId(`cartao-${nome}`);
    }
  }
  private mensagemDeErro(erro: unknown): string {
    return erro instanceof HttpErrorResponse && typeof erro.error?.detail === 'string'
      ? erro.error.detail
      : this.translate.instant('CARTOES.MENSAGENS.ERRO_SALVAR');
  }
}
