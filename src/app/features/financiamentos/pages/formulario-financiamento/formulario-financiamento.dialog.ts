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
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs';

import { FocoAcessivelService } from '../../../../core/accessibility/foco-acessivel.service';
import {
  ReferenciaFinanceira,
  ReferenciasFinanceirasApiService,
} from '../../../../core/api/referencias-financeiras-api.service';
import {
  converterDecimalParaNumero,
  validarDecimalPositivo,
} from '../../../../shared/forms/decimal.validators';
import { validarTextoObrigatorio } from '../../../../shared/forms/texto-obrigatorio.validators';
import {
  ConfirmacaoDialogComponent,
  ConfirmacaoDialogData,
} from '../../../../shared/ui/confirmacao/confirmacao-dialog';
import { CampoFormularioComponent } from '../../../../shared/ui/campo-formulario/campo-formulario';
import { IndicadorProcessamentoComponent } from '../../../../shared/ui/indicador-processamento/indicador-processamento';
import { MensagemValidacaoComponent } from '../../../../shared/ui/mensagem-validacao/mensagem-validacao';
import { FinanciamentoRequest } from '../../financiamento.model';
import { FinanciamentosApiService } from '../../financiamentos-api.service';

interface ControlesFormularioFinanciamento {
  readonly descricao: FormControl<string>;
  readonly principal: FormControl<string>;
  readonly taxaJurosMensal: FormControl<string>;
  readonly numeroParcelas: FormControl<number>;
  readonly dataInicio: FormControl<string>;
  readonly contaId: FormControl<number | null>;
}

@Component({
  selector: 'app-formulario-financiamento-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    TranslatePipe,
    CampoFormularioComponent,
    IndicadorProcessamentoComponent,
    MensagemValidacaoComponent,
  ],
  templateUrl: './formulario-financiamento.dialog.html',
  styleUrl: './formulario-financiamento.dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormularioFinanciamentoDialogComponent {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly api = inject(FinanciamentosApiService);
  private readonly referenciasApi = inject(ReferenciasFinanceirasApiService);
  private readonly foco = inject(FocoAcessivelService);
  private readonly dialog = inject(MatDialog);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly dialogRef = inject(MatDialogRef<FormularioFinanciamentoDialogComponent>);

  protected readonly carregandoReferencias = signal(true);
  protected readonly enviando = signal(false);
  protected readonly enviado = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly erroReferencias = signal<string | null>(null);
  protected readonly contas = signal<readonly ReferenciaFinanceira[]>([]);
  protected readonly formulario: FormGroup<ControlesFormularioFinanciamento> =
    this.formBuilder.group({
      descricao: this.formBuilder.control('', [
        Validators.required,
        validarTextoObrigatorio(),
        Validators.maxLength(300),
      ]),
      principal: this.formBuilder.control('', [Validators.required, validarDecimalPositivo()]),
      taxaJurosMensal: this.formBuilder.control('0', [
        Validators.required,
        Validators.pattern(/^\d+(?:[.,]\d+)?$/),
      ]),
      numeroParcelas: this.formBuilder.control(1, [Validators.required, Validators.min(1)]),
      dataInicio: this.formBuilder.control('', Validators.required),
      contaId: this.formBuilder.control<number | null>(null, Validators.required),
    });

  constructor() {
    this.carregarReferencias();
  }

  protected tentarCarregarReferencias(): void {
    this.carregarReferencias();
  }

  protected salvar(): void {
    this.enviado.set(true);
    this.erro.set(null);
    if (this.formulario.invalid || this.enviando() || this.carregandoReferencias()) {
      this.formulario.markAllAsTouched();
      this.focarPrimeiroInvalido();
      return;
    }
    const valores = this.formulario.getRawValue();
    const principal = converterDecimalParaNumero(valores.principal);
    const taxaJurosMensal = Number(valores.taxaJurosMensal.replace(',', '.'));
    if (
      principal === null ||
      valores.contaId === null ||
      !Number.isFinite(taxaJurosMensal) ||
      taxaJurosMensal < 0
    ) {
      this.erro.set(this.translate.instant('PLANEJAMENTO_FINANCEIRO.VALIDACOES.JUROS'));
      return;
    }
    const requisicao: FinanciamentoRequest = {
      descricao: valores.descricao.trim(),
      principal,
      taxaJurosMensal,
      numeroParcelas: valores.numeroParcelas,
      dataInicio: valores.dataInicio,
      contaId: valores.contaId,
    };
    this.enviando.set(true);
    this.api
      .criar(requisicao)
      .pipe(
        finalize(() => this.enviando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.dialogRef.close(true),
        error: (erro: unknown) => this.erro.set(this.mensagemDeErro(erro)),
      });
  }

  protected cancelar(): void {
    if (!this.formulario.dirty) {
      this.dialogRef.close(false);
      return;
    }
    const dados: ConfirmacaoDialogData = {
      titulo: this.translate.instant('PLANEJAMENTO_FINANCEIRO.CONFIRMACAO_DESCARTE.TITULO'),
      mensagem: this.translate.instant('PLANEJAMENTO_FINANCEIRO.CONFIRMACAO_DESCARTE.MENSAGEM'),
      rotuloConfirmar: this.translate.instant(
        'PLANEJAMENTO_FINANCEIRO.CONFIRMACAO_DESCARTE.CONFIRMAR',
      ),
      rotuloCancelar: this.translate.instant('COMPARTILHADO.ACOES.CANCELAR'),
      tom: 'perigoso',
    };
    this.dialog
      .open(ConfirmacaoDialogComponent, { data: dados, panelClass: 'finisus-dialog' })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmado: boolean | undefined) => {
        if (confirmado) this.dialogRef.close(false);
      });
  }

  protected campoInvalido(nome: keyof ControlesFormularioFinanciamento): boolean {
    return this.enviado() && this.formulario.controls[nome].invalid;
  }

  private carregarReferencias(): void {
    this.carregandoReferencias.set(true);
    this.erroReferencias.set(null);
    this.referenciasApi
      .listar('contas')
      .pipe(
        finalize(() => this.carregandoReferencias.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (contas) => this.contas.set(contas),
        error: () =>
          this.erroReferencias.set(
            this.translate.instant('PLANEJAMENTO_FINANCEIRO.MENSAGENS.ERRO_REFERENCIAS'),
          ),
      });
  }

  private focarPrimeiroInvalido(): void {
    const nome = (
      Object.keys(this.formulario.controls) as (keyof ControlesFormularioFinanciamento)[]
    ).find((campo) => this.formulario.controls[campo].invalid);
    if (nome) this.foco.focarPorId(`financiamento-${nome}`);
  }

  private mensagemDeErro(erro: unknown): string {
    if (erro instanceof HttpErrorResponse && typeof erro.error?.detail === 'string')
      return erro.error.detail;
    return this.translate.instant('PLANEJAMENTO_FINANCEIRO.MENSAGENS.ERRO_SALVAR');
  }
}
