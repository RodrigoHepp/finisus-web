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
import { finalize, forkJoin } from 'rxjs';

import { CampoFormularioComponent } from '../../../../shared/ui/campo-formulario/campo-formulario';
import { MensagemValidacaoComponent } from '../../../../shared/ui/mensagem-validacao/mensagem-validacao';
import {
  converterDecimalParaNumero,
  formatarDecimalParaCampo,
  validarDecimalPositivo,
} from '../../../../shared/forms/decimal.validators';
import { validarTextoObrigatorio } from '../../../../shared/forms/texto-obrigatorio.validators';
import {
  ConfirmacaoDialogComponent,
  ConfirmacaoDialogData,
} from '../../../../shared/ui/confirmacao/confirmacao-dialog';
import { FocoAcessivelService } from '../../../../core/accessibility/foco-acessivel.service';
import {
  ReferenciaFinanceira,
  ReferenciasFinanceirasApiService,
} from '../../../../core/api/referencias-financeiras-api.service';
import { IndicadorProcessamentoComponent } from '../../../../shared/ui/indicador-processamento/indicador-processamento';
import { TipoTransacao, Transacao, TransacaoRequest } from '../../transacoes.models';
import { TransacoesApiService } from '../../data-access/transacoes-api.service';

export interface DadosFormularioTransacao {
  readonly transacao?: Transacao;
}

interface ControlesFormularioTransacao {
  readonly tipo: FormControl<TipoTransacao | null>;
  readonly valor: FormControl<string>;
  readonly data: FormControl<string>;
  readonly descricao: FormControl<string>;
  readonly contaId: FormControl<number | null>;
  readonly categoriaId: FormControl<number | null>;
  readonly meioPagamentoId: FormControl<number | null>;
}

@Component({
  selector: 'app-formulario-transacao',
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
    MensagemValidacaoComponent,
    IndicadorProcessamentoComponent,
  ],
  templateUrl: './formulario-transacao.page.html',
  styleUrl: './formulario-transacao.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormularioTransacaoPage {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly apiService = inject(TransacoesApiService);
  private readonly referenciasApiService = inject(ReferenciasFinanceirasApiService);
  private readonly focoAcessivelService = inject(FocoAcessivelService);
  private readonly translateService = inject(TranslateService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly dialogRef = inject(MatDialogRef<FormularioTransacaoPage>);
  private readonly dados = inject<DadosFormularioTransacao>(MAT_DIALOG_DATA);

  protected readonly carregando = signal(true);
  protected readonly enviando = signal(false);
  protected readonly enviado = signal(false);
  protected readonly mensagem = signal<string | null>(null);
  protected readonly erroReferencias = signal<string | null>(null);
  protected readonly contas = signal<readonly ReferenciaFinanceira[]>([]);
  protected readonly categorias = signal<readonly ReferenciaFinanceira[]>([]);
  protected readonly meiosPagamento = signal<readonly ReferenciaFinanceira[]>([]);
  protected readonly editando = this.dados.transacao !== undefined;
  protected readonly formulario: FormGroup<ControlesFormularioTransacao> = this.formBuilder.group({
    tipo: this.formBuilder.control<TipoTransacao | null>(null, Validators.required),
    valor: this.formBuilder.control('', [Validators.required, validarDecimalPositivo()]),
    data: this.formBuilder.control('', Validators.required),
    descricao: this.formBuilder.control('', [
      Validators.required,
      validarTextoObrigatorio(),
      Validators.maxLength(500),
    ]),
    contaId: this.formBuilder.control<number | null>(null, Validators.required),
    categoriaId: this.formBuilder.control<number | null>(null),
    meioPagamentoId: this.formBuilder.control<number | null>(null),
  });

  constructor() {
    const transacao = this.dados.transacao;
    if (transacao) {
      this.formulario.patchValue({
        ...transacao,
        valor: formatarDecimalParaCampo(transacao.valor),
      });
    }

    this.carregarReferencias();
  }

  protected tentarCarregarReferencias(): void {
    this.carregarReferencias();
  }

  protected salvar(): void {
    this.enviado.set(true);
    this.mensagem.set(null);
    if (this.formulario.invalid || this.enviando() || this.carregando()) {
      this.focarPrimeiroInvalido();
      return;
    }

    const valores = this.formulario.getRawValue();
    const valor = converterDecimalParaNumero(valores.valor);
    if (valores.tipo === null || valor === null || valores.contaId === null) {
      return;
    }
    const requisicao: TransacaoRequest = {
      tipo: valores.tipo,
      valor,
      data: valores.data,
      descricao: valores.descricao.trim(),
      contaId: valores.contaId,
      ...(valores.categoriaId ? { categoriaId: valores.categoriaId } : {}),
      ...(valores.meioPagamentoId ? { meioPagamentoId: valores.meioPagamentoId } : {}),
    };
    const operacao = this.dados.transacao
      ? this.apiService.atualizar(this.dados.transacao.id, requisicao)
      : this.apiService.criar(requisicao);
    this.enviando.set(true);
    operacao
      .pipe(
        finalize(() => this.enviando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.dialogRef.close(true),
        error: (erro: unknown) => this.mensagem.set(this.mensagemDeErro(erro)),
      });
  }

  protected cancelar(): void {
    if (!this.formulario.dirty) {
      this.dialogRef.close(false);
      return;
    }

    const dados: ConfirmacaoDialogData = {
      titulo: this.translateService.instant('CADASTROS.CONFIRMACAO_DESCARTE.TITULO'),
      mensagem: this.translateService.instant('CADASTROS.CONFIRMACAO_DESCARTE.MENSAGEM'),
      rotuloConfirmar: this.translateService.instant('CADASTROS.CONFIRMACAO_DESCARTE.CONFIRMAR'),
      rotuloCancelar: this.translateService.instant('COMPARTILHADO.ACOES.CANCELAR'),
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

  protected campoInvalido(nome: keyof ControlesFormularioTransacao): boolean {
    return this.enviado() && this.formulario.controls[nome].invalid;
  }

  private carregarReferencias(): void {
    this.carregando.set(true);
    this.erroReferencias.set(null);

    forkJoin({
      contas: this.referenciasApiService.listar('contas'),
      categorias: this.referenciasApiService.listar('categorias'),
      meiosPagamento: this.referenciasApiService.listar('meios-pagamento'),
    })
      .pipe(
        finalize(() => this.carregando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ contas, categorias, meiosPagamento }) => {
          this.contas.set(contas);
          this.categorias.set(categorias);
          this.meiosPagamento.set(meiosPagamento);
        },
        error: (erro: unknown) => this.erroReferencias.set(this.mensagemDeErro(erro)),
      });
  }

  private focarPrimeiroInvalido(): void {
    const nome = (
      Object.keys(this.formulario.controls) as (keyof ControlesFormularioTransacao)[]
    ).find((campo) => this.formulario.controls[campo].invalid);
    if (nome) {
      this.focoAcessivelService.focarPorId(`transacao-${nome}`);
    }
  }

  private mensagemDeErro(erro: unknown): string {
    if (erro instanceof HttpErrorResponse && typeof erro.error?.detail === 'string') {
      return erro.error.detail;
    }
    return this.translateService.instant('TRANSACOES.MENSAGENS.ERRO_SALVAR');
  }
}
