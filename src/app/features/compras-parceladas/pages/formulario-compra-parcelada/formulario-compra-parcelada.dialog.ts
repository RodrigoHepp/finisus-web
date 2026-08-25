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
import { finalize, forkJoin } from 'rxjs';

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
import { CompraParceladaRequest } from '../../compra-parcelada.model';
import { ComprasParceladasApiService } from '../../compras-parceladas-api.service';

interface ControlesFormularioCompraParcelada {
  readonly descricao: FormControl<string>;
  readonly valorTotal: FormControl<string>;
  readonly numeroParcelas: FormControl<number>;
  readonly dataCompra: FormControl<string>;
  readonly categoriaId: FormControl<number | null>;
  readonly contaId: FormControl<number | null>;
}

@Component({
  selector: 'app-formulario-compra-parcelada-dialog',
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
  templateUrl: './formulario-compra-parcelada.dialog.html',
  styleUrl: './formulario-compra-parcelada.dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormularioCompraParceladaDialogComponent {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly api = inject(ComprasParceladasApiService);
  private readonly referenciasApi = inject(ReferenciasFinanceirasApiService);
  private readonly foco = inject(FocoAcessivelService);
  private readonly dialog = inject(MatDialog);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly dialogRef = inject(MatDialogRef<FormularioCompraParceladaDialogComponent>);

  protected readonly carregandoReferencias = signal(true);
  protected readonly enviando = signal(false);
  protected readonly enviado = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly erroReferencias = signal<string | null>(null);
  protected readonly contas = signal<readonly ReferenciaFinanceira[]>([]);
  protected readonly categorias = signal<readonly ReferenciaFinanceira[]>([]);
  protected readonly formulario: FormGroup<ControlesFormularioCompraParcelada> =
    this.formBuilder.group({
      descricao: this.formBuilder.control('', [
        Validators.required,
        validarTextoObrigatorio(),
        Validators.maxLength(300),
      ]),
      valorTotal: this.formBuilder.control('', [Validators.required, validarDecimalPositivo()]),
      numeroParcelas: this.formBuilder.control(1, [Validators.required, Validators.min(1)]),
      dataCompra: this.formBuilder.control('', Validators.required),
      categoriaId: this.formBuilder.control<number | null>(null),
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
    const valorTotal = converterDecimalParaNumero(valores.valorTotal);
    if (valorTotal === null || valores.contaId === null) return;
    const requisicao: CompraParceladaRequest = {
      descricao: valores.descricao.trim(),
      valorTotal,
      numeroParcelas: valores.numeroParcelas,
      dataCompra: valores.dataCompra,
      contaId: valores.contaId,
      ...(valores.categoriaId === null ? {} : { categoriaId: valores.categoriaId }),
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

  protected campoInvalido(nome: keyof ControlesFormularioCompraParcelada): boolean {
    return this.enviado() && this.formulario.controls[nome].invalid;
  }

  private carregarReferencias(): void {
    this.carregandoReferencias.set(true);
    this.erroReferencias.set(null);
    forkJoin({
      contas: this.referenciasApi.listar('contas'),
      categorias: this.referenciasApi.listar('categorias'),
    })
      .pipe(
        finalize(() => this.carregandoReferencias.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ contas, categorias }) => {
          this.contas.set(contas);
          this.categorias.set(categorias);
        },
        error: () =>
          this.erroReferencias.set(
            this.translate.instant('PLANEJAMENTO_FINANCEIRO.MENSAGENS.ERRO_REFERENCIAS'),
          ),
      });
  }

  private focarPrimeiroInvalido(): void {
    const nome = (
      Object.keys(this.formulario.controls) as (keyof ControlesFormularioCompraParcelada)[]
    ).find((campo) => this.formulario.controls[campo].invalid);
    if (nome) this.foco.focarPorId(`compra-${nome}`);
  }

  private mensagemDeErro(erro: unknown): string {
    if (erro instanceof HttpErrorResponse && typeof erro.error?.detail === 'string')
      return erro.error.detail;
    return this.translate.instant('PLANEJAMENTO_FINANCEIRO.MENSAGENS.ERRO_SALVAR');
  }
}
