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
import { MatSelectModule } from '@angular/material/select';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs';

import { FocoAcessivelService } from '../../../../core/accessibility/foco-acessivel.service';
import { MensagemGlobalService } from '../../../../core/feedback/mensagem-global.service';
import { validarTextoObrigatorio } from '../../../../shared/forms/texto-obrigatorio.validators';
import {
  ReferenciaFinanceira,
  ReferenciasFinanceirasApiService,
} from '../../../../core/api/referencias-financeiras-api.service';
import { CampoFormularioComponent } from '../../../../shared/ui/campo-formulario/campo-formulario';
import { CabecalhoDialogoFormularioComponent } from '../../../../shared/ui/cabecalho-dialogo-formulario/cabecalho-dialogo-formulario';
import { MensagemValidacaoComponent } from '../../../../shared/ui/mensagem-validacao/mensagem-validacao';
import {
  ConfirmacaoDialogComponent,
  ConfirmacaoDialogData,
} from '../../../../shared/ui/confirmacao/confirmacao-dialog';
import { Conta, ContaRequest, TipoConta } from '../../conta.model';
import { ContasApiService } from '../../contas-api.service';

export interface DadosFormularioConta {
  readonly conta?: Conta;
}
interface ControlesFormularioConta {
  readonly nome: FormControl<string>;
  readonly tipo: FormControl<TipoConta | null>;
  readonly bancoId: FormControl<number | null>;
}

const TIPOS_DE_CONTA: readonly TipoConta[] = ['FISICO', 'CORRENTE', 'POUPANCA', 'APLICACAO'];

@Component({
  selector: 'app-formulario-conta-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    TranslatePipe,
    CampoFormularioComponent,
    CabecalhoDialogoFormularioComponent,
    MensagemValidacaoComponent,
  ],
  templateUrl: './formulario-conta.dialog.html',
  styleUrl: './formulario-conta.dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormularioContaDialogComponent {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly api = inject(ContasApiService);
  private readonly referenciasApi = inject(ReferenciasFinanceirasApiService);
  private readonly foco = inject(FocoAcessivelService);
  private readonly mensagens = inject(MensagemGlobalService);
  private readonly dialog = inject(MatDialog);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dados = inject<DadosFormularioConta>(MAT_DIALOG_DATA);
  protected readonly dialogRef = inject(MatDialogRef<FormularioContaDialogComponent>);
  protected readonly bancos = signal<readonly ReferenciaFinanceira[]>([]);
  protected readonly carregandoBancos = signal(true);
  protected readonly enviando = signal(false);
  protected readonly enviado = signal(false);
  protected readonly mensagem = signal<string | null>(null);
  protected readonly editando = this.dados.conta !== undefined;
  protected readonly tiposDeConta = TIPOS_DE_CONTA;
  protected readonly formulario: FormGroup<ControlesFormularioConta> = this.formBuilder.group({
    nome: this.formBuilder.control(this.dados.conta?.nome ?? '', [
      Validators.required,
      validarTextoObrigatorio(),
      Validators.maxLength(150),
    ]),
    tipo: this.formBuilder.control<TipoConta | null>(
      this.dados.conta?.tipo ?? null,
      Validators.required,
    ),
    bancoId: this.formBuilder.control<number | null>(this.dados.conta?.bancoId ?? null),
  });
  constructor() {
    this.referenciasApi
      .listar('bancos')
      .pipe(
        finalize(() => this.carregandoBancos.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (bancos) => this.bancos.set(bancos),
        error: (erro: unknown) => this.mensagem.set(this.mensagemDeErro(erro)),
      });
  }
  protected salvar(): void {
    this.enviado.set(true);
    this.mensagem.set(null);
    if (this.formulario.invalid || this.enviando()) {
      this.focarPrimeiroInvalido();
      return;
    }
    const valores = this.formulario.getRawValue();
    if (!valores.tipo) {
      return;
    }
    const requisicao: ContaRequest = {
      nome: valores.nome.trim(),
      tipo: valores.tipo,
      ...(valores.bancoId ? { bancoId: valores.bancoId } : {}),
    };
    const operacao = this.dados.conta
      ? this.api.atualizar(this.dados.conta.id, requisicao)
      : this.api.criar(requisicao);
    this.enviando.set(true);
    operacao
      .pipe(
        finalize(() => this.enviando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (conta) => {
          this.mensagens.sucesso(
            this.translate.instant(
              this.dados.conta
                ? 'CADASTROS.MENSAGENS.ATUALIZADO_COM_SUCESSO'
                : 'CADASTROS.MENSAGENS.CRIADO_COM_SUCESSO',
              { nome: conta.nome },
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
  protected campoInvalido(nome: keyof ControlesFormularioConta): boolean {
    return this.enviado() && this.formulario.controls[nome].invalid;
  }
  private focarPrimeiroInvalido(): void {
    const nome = (Object.keys(this.formulario.controls) as (keyof ControlesFormularioConta)[]).find(
      (campo) => this.formulario.controls[campo].invalid,
    );
    if (nome) {
      this.foco.focarPorId(`conta-${nome}`);
    }
  }
  private mensagemDeErro(erro: unknown): string {
    return erro instanceof HttpErrorResponse && typeof erro.error?.detail === 'string'
      ? erro.error.detail
      : this.translate.instant('CADASTROS.MENSAGENS.ERRO_SALVAR');
  }
}
