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

import { FocoAcessivelService } from '../../../../core/accessibility/foco-acessivel.service';
import { MensagemGlobalService } from '../../../../core/feedback/mensagem-global.service';
import { validarTextoObrigatorio } from '../../../../shared/forms/texto-obrigatorio.validators';
import { CampoFormularioComponent } from '../../../../shared/ui/campo-formulario/campo-formulario';
import { CabecalhoDialogoFormularioComponent } from '../../../../shared/ui/cabecalho-dialogo-formulario/cabecalho-dialogo-formulario';
import { MensagemValidacaoComponent } from '../../../../shared/ui/mensagem-validacao/mensagem-validacao';
import {
  ConfirmacaoDialogComponent,
  ConfirmacaoDialogData,
} from '../../../../shared/ui/confirmacao/confirmacao-dialog';
import { MeioPagamento, MeioPagamentoRequest } from '../../meio-pagamento.model';
import { MeiosPagamentoApiService } from '../../meios-pagamento-api.service';

export interface DadosFormularioMeioPagamento {
  readonly meioPagamento?: MeioPagamento;
}
interface ControlesFormularioMeioPagamento {
  readonly nome: FormControl<string>;
}
@Component({
  selector: 'app-formulario-meio-pagamento-dialog',
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
  templateUrl: './formulario-meio-pagamento.dialog.html',
  styleUrl: './formulario-meio-pagamento.dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormularioMeioPagamentoDialogComponent {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly api = inject(MeiosPagamentoApiService);
  private readonly foco = inject(FocoAcessivelService);
  private readonly mensagens = inject(MensagemGlobalService);
  private readonly dialog = inject(MatDialog);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dados = inject<DadosFormularioMeioPagamento>(MAT_DIALOG_DATA);
  protected readonly dialogRef = inject(MatDialogRef<FormularioMeioPagamentoDialogComponent>);
  protected readonly enviando = signal(false);
  protected readonly enviado = signal(false);
  protected readonly mensagem = signal<string | null>(null);
  protected readonly editando = this.dados.meioPagamento !== undefined;
  protected readonly formulario: FormGroup<ControlesFormularioMeioPagamento> =
    this.formBuilder.group({
      nome: this.formBuilder.control(this.dados.meioPagamento?.nome ?? '', [
        Validators.required,
        validarTextoObrigatorio(),
        Validators.maxLength(100),
      ]),
    });
  protected salvar(): void {
    this.enviado.set(true);
    this.mensagem.set(null);
    if (this.formulario.invalid || this.enviando()) {
      this.foco.focarPorId('meio-pagamento-nome');
      return;
    }
    const requisicao: MeioPagamentoRequest = { nome: this.formulario.controls.nome.value.trim() };
    const operacao = this.dados.meioPagamento
      ? this.api.atualizar(this.dados.meioPagamento.id, requisicao)
      : this.api.criar(requisicao);
    this.enviando.set(true);
    operacao
      .pipe(
        finalize(() => this.enviando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (meioPagamento) => {
          this.mensagens.sucesso(
            this.translate.instant(
              this.dados.meioPagamento
                ? 'CADASTROS.MENSAGENS.ATUALIZADO_COM_SUCESSO'
                : 'CADASTROS.MENSAGENS.CRIADO_COM_SUCESSO',
              { nome: meioPagamento.nome },
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
  protected campoInvalido(): boolean {
    return this.enviado() && this.formulario.controls.nome.invalid;
  }
  private mensagemDeErro(erro: unknown): string {
    return erro instanceof HttpErrorResponse && typeof erro.error?.detail === 'string'
      ? erro.error.detail
      : this.translate.instant('CADASTROS.MENSAGENS.ERRO_SALVAR');
  }
}
