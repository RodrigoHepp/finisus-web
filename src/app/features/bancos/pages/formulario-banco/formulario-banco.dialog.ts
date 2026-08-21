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
import { Banco, BancoRequest } from '../../banco.model';
import { BancosApiService } from '../../bancos-api.service';

export interface DadosFormularioBanco {
  readonly banco?: Banco;
}

interface ControlesFormularioBanco {
  readonly nome: FormControl<string>;
  readonly codigo: FormControl<string>;
}

@Component({
  selector: 'app-formulario-banco-dialog',
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
  templateUrl: './formulario-banco.dialog.html',
  styleUrl: './formulario-banco.dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormularioBancoDialogComponent {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly api = inject(BancosApiService);
  private readonly foco = inject(FocoAcessivelService);
  private readonly mensagens = inject(MensagemGlobalService);
  private readonly dialog = inject(MatDialog);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dados = inject<DadosFormularioBanco>(MAT_DIALOG_DATA);
  protected readonly dialogRef = inject(MatDialogRef<FormularioBancoDialogComponent>);

  protected readonly enviando = signal(false);
  protected readonly enviado = signal(false);
  protected readonly mensagem = signal<string | null>(null);
  protected readonly editando = this.dados.banco !== undefined;
  protected readonly formulario: FormGroup<ControlesFormularioBanco> = this.formBuilder.group({
    nome: this.formBuilder.control(this.dados.banco?.nome ?? '', [
      Validators.required,
      validarTextoObrigatorio(),
      Validators.maxLength(150),
    ]),
    codigo: this.formBuilder.control(this.dados.banco?.codigo ?? '', [
      Validators.required,
      validarTextoObrigatorio(),
      Validators.maxLength(20),
    ]),
  });

  protected salvar(): void {
    this.enviado.set(true);
    this.mensagem.set(null);
    if (this.formulario.invalid || this.enviando()) {
      this.focarPrimeiroInvalido();
      return;
    }
    const valores = this.formulario.getRawValue();
    const requisicao: BancoRequest = { nome: valores.nome.trim(), codigo: valores.codigo.trim() };
    const operacao = this.dados.banco
      ? this.api.atualizar(this.dados.banco.id, requisicao)
      : this.api.criar(requisicao);
    this.enviando.set(true);
    operacao
      .pipe(
        finalize(() => this.enviando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (banco) => {
          this.mensagens.sucesso(
            this.translate.instant(
              this.dados.banco
                ? 'CADASTROS.MENSAGENS.ATUALIZADO_COM_SUCESSO'
                : 'CADASTROS.MENSAGENS.CRIADO_COM_SUCESSO',
              { nome: banco.nome },
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

  protected campoInvalido(nome: keyof ControlesFormularioBanco): boolean {
    return this.enviado() && this.formulario.controls[nome].invalid;
  }

  private focarPrimeiroInvalido(): void {
    const nome = (Object.keys(this.formulario.controls) as (keyof ControlesFormularioBanco)[]).find(
      (campo) => this.formulario.controls[campo].invalid,
    );
    if (nome) {
      this.foco.focarPorId(`banco-${nome}`);
    }
  }

  private mensagemDeErro(erro: unknown): string {
    if (erro instanceof HttpErrorResponse && typeof erro.error?.detail === 'string') {
      return erro.error.detail;
    }
    return this.translate.instant('CADASTROS.MENSAGENS.ERRO_SALVAR');
  }
}
