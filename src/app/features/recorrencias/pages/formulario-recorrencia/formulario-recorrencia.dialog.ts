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
import { TipoTransacao } from '../../../transacoes/transacoes.models';
import { Recorrencia, RecorrenciaRequest } from '../../recorrencia.model';
import { RecorrenciasApiService } from '../../recorrencias-api.service';

export interface DadosFormularioRecorrencia {
  readonly recorrencia?: Recorrencia;
}

interface ControlesFormularioRecorrencia {
  readonly nome: FormControl<string>;
  readonly tipo: FormControl<TipoTransacao>;
  readonly valorEsperado: FormControl<string>;
  readonly diaDoMes: FormControl<number>;
  readonly categoriaId: FormControl<number | null>;
  readonly contaId: FormControl<number | null>;
  readonly meioPagamentoId: FormControl<number | null>;
}

@Component({
  selector: 'app-formulario-recorrencia-dialog',
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
  templateUrl: './formulario-recorrencia.dialog.html',
  styleUrl: './formulario-recorrencia.dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormularioRecorrenciaDialogComponent {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly api = inject(RecorrenciasApiService);
  private readonly referenciasApi = inject(ReferenciasFinanceirasApiService);
  private readonly foco = inject(FocoAcessivelService);
  private readonly dialog = inject(MatDialog);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dados = inject<DadosFormularioRecorrencia>(MAT_DIALOG_DATA);
  protected readonly dialogRef = inject(MatDialogRef<FormularioRecorrenciaDialogComponent>);

  protected readonly carregandoReferencias = signal(true);
  protected readonly enviando = signal(false);
  protected readonly enviado = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly erroReferencias = signal<string | null>(null);
  protected readonly contas = signal<readonly ReferenciaFinanceira[]>([]);
  protected readonly categorias = signal<readonly ReferenciaFinanceira[]>([]);
  protected readonly meiosPagamento = signal<readonly ReferenciaFinanceira[]>([]);
  protected readonly editando = this.dados.recorrencia !== undefined;
  protected readonly formulario: FormGroup<ControlesFormularioRecorrencia> = this.formBuilder.group(
    {
      nome: this.formBuilder.control(this.dados.recorrencia?.nome ?? '', [
        Validators.required,
        validarTextoObrigatorio(),
        Validators.maxLength(150),
      ]),
      tipo: this.formBuilder.control(this.dados.recorrencia?.tipo ?? 'SAIDA', Validators.required),
      valorEsperado: this.formBuilder.control(
        this.dados.recorrencia ? String(this.dados.recorrencia.valorEsperado) : '',
        [Validators.required, validarDecimalPositivo()],
      ),
      diaDoMes: this.formBuilder.control(this.dados.recorrencia?.diaDoMes ?? 1, [
        Validators.required,
        Validators.min(1),
        Validators.max(31),
      ]),
      categoriaId: this.formBuilder.control<number | null>(
        this.dados.recorrencia?.categoriaId ?? null,
      ),
      contaId: this.formBuilder.control<number | null>(
        this.dados.recorrencia?.contaId ?? null,
        Validators.required,
      ),
      meioPagamentoId: this.formBuilder.control<number | null>(
        this.dados.recorrencia?.meioPagamentoId ?? null,
      ),
    },
  );

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
      this.focarPrimeiroInvalido();
      return;
    }

    const valores = this.formulario.getRawValue();
    const valorEsperado = converterDecimalParaNumero(valores.valorEsperado);
    if (valorEsperado === null || valores.contaId === null) {
      return;
    }

    const requisicao: RecorrenciaRequest = {
      nome: valores.nome.trim(),
      tipo: valores.tipo,
      valorEsperado,
      diaDoMes: valores.diaDoMes,
      contaId: valores.contaId,
      ...(valores.categoriaId === null ? {} : { categoriaId: valores.categoriaId }),
      ...(valores.meioPagamentoId === null ? {} : { meioPagamentoId: valores.meioPagamentoId }),
    };
    this.enviando.set(true);
    (this.dados.recorrencia
      ? this.api.atualizar(this.dados.recorrencia.id, requisicao)
      : this.api.criar(requisicao)
    )
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

  protected campoInvalido(nome: keyof ControlesFormularioRecorrencia): boolean {
    return this.enviado() && this.formulario.controls[nome].invalid;
  }

  private carregarReferencias(): void {
    this.carregandoReferencias.set(true);
    this.erroReferencias.set(null);
    forkJoin({
      contas: this.referenciasApi.listar('contas'),
      categorias: this.referenciasApi.listar('categorias'),
      meiosPagamento: this.referenciasApi.listar('meios-pagamento'),
    })
      .pipe(
        finalize(() => this.carregandoReferencias.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ contas, categorias, meiosPagamento }) => {
          this.contas.set(contas);
          this.categorias.set(categorias);
          this.meiosPagamento.set(meiosPagamento);
        },
        error: () =>
          this.erroReferencias.set(
            this.translate.instant('PLANEJAMENTO_FINANCEIRO.MENSAGENS.ERRO_REFERENCIAS'),
          ),
      });
  }

  private focarPrimeiroInvalido(): void {
    const nome = (
      Object.keys(this.formulario.controls) as (keyof ControlesFormularioRecorrencia)[]
    ).find((campo) => this.formulario.controls[campo].invalid);
    if (nome) this.foco.focarPorId(`recorrencia-${nome}`);
  }

  private mensagemDeErro(erro: unknown): string {
    if (erro instanceof HttpErrorResponse && typeof erro.error?.detail === 'string') {
      return erro.error.detail;
    }
    return this.translate.instant('PLANEJAMENTO_FINANCEIRO.MENSAGENS.ERRO_SALVAR');
  }
}
