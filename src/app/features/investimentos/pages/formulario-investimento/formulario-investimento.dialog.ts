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
import { finalize } from 'rxjs';

import { FocoAcessivelService } from '../../../../core/accessibility/foco-acessivel.service';
import {
  ReferenciaFinanceira,
  ReferenciasFinanceirasApiService,
} from '../../../../core/api/referencias-financeiras-api.service';
import { validarTextoObrigatorio } from '../../../../shared/forms/texto-obrigatorio.validators';
import {
  ConfirmacaoDialogComponent,
  ConfirmacaoDialogData,
} from '../../../../shared/ui/confirmacao/confirmacao-dialog';
import { CampoFormularioComponent } from '../../../../shared/ui/campo-formulario/campo-formulario';
import { IndicadorProcessamentoComponent } from '../../../../shared/ui/indicador-processamento/indicador-processamento';
import { MensagemValidacaoComponent } from '../../../../shared/ui/mensagem-validacao/mensagem-validacao';
import { Investimento, InvestimentoRequest, TipoInvestimento } from '../../investimento.model';
import { InvestimentosApiService } from '../../investimentos-api.service';

export interface DadosFormularioInvestimento {
  readonly investimento?: Investimento;
}

interface ControlesFormularioInvestimento {
  readonly nome: FormControl<string>;
  readonly tipo: FormControl<TipoInvestimento>;
  readonly contaOrigemId: FormControl<number | null>;
}

@Component({
  selector: 'app-formulario-investimento-dialog',
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
  templateUrl: './formulario-investimento.dialog.html',
  styleUrl: './formulario-investimento.dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormularioInvestimentoDialogComponent {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly api = inject(InvestimentosApiService);
  private readonly referenciasApi = inject(ReferenciasFinanceirasApiService);
  private readonly foco = inject(FocoAcessivelService);
  private readonly dialog = inject(MatDialog);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dados = inject<DadosFormularioInvestimento>(MAT_DIALOG_DATA);
  protected readonly dialogRef = inject(MatDialogRef<FormularioInvestimentoDialogComponent>);

  protected readonly carregandoReferencias = signal(true);
  protected readonly enviando = signal(false);
  protected readonly enviado = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly erroReferencias = signal<string | null>(null);
  protected readonly contas = signal<readonly ReferenciaFinanceira[]>([]);
  protected readonly editando = this.dados.investimento !== undefined;
  protected readonly tipos: readonly TipoInvestimento[] = [
    'RENDA_FIXA',
    'RENDA_VARIAVEL',
    'FUNDO',
    'CRIPTO',
    'OUTRO',
  ];
  protected readonly formulario: FormGroup<ControlesFormularioInvestimento> =
    this.formBuilder.group({
      nome: this.formBuilder.control(this.dados.investimento?.nome ?? '', [
        Validators.required,
        validarTextoObrigatorio(),
        Validators.maxLength(150),
      ]),
      tipo: this.formBuilder.control<TipoInvestimento>(
        this.dados.investimento?.tipo ?? 'RENDA_FIXA',
        Validators.required,
      ),
      contaOrigemId: this.formBuilder.control<number | null>(
        this.dados.investimento?.contaOrigemId ?? null,
        Validators.required,
      ),
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
    if (valores.contaOrigemId === null) return;

    const requisicao: InvestimentoRequest = {
      nome: valores.nome.trim(),
      tipo: valores.tipo,
      contaOrigemId: valores.contaOrigemId,
    };
    this.enviando.set(true);
    (this.dados.investimento
      ? this.api.atualizar(this.dados.investimento.id, requisicao)
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

  protected campoInvalido(nome: keyof ControlesFormularioInvestimento): boolean {
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
      Object.keys(this.formulario.controls) as (keyof ControlesFormularioInvestimento)[]
    ).find((campo) => this.formulario.controls[campo].invalid);
    if (nome) this.foco.focarPorId(`investimento-${nome}`);
  }

  private mensagemDeErro(erro: unknown): string {
    if (erro instanceof HttpErrorResponse && typeof erro.error?.detail === 'string') {
      return erro.error.detail;
    }
    return this.translate.instant('PLANEJAMENTO_FINANCEIRO.MENSAGENS.ERRO_SALVAR');
  }
}
