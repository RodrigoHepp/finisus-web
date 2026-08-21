import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Observable, forkJoin } from 'rxjs';

import {
  ReferenciaFinanceira,
  ReferenciasFinanceirasApiService,
} from '../../../../core/api/referencias-financeiras-api.service';
import { MensagemGlobalService } from '../../../../core/feedback/mensagem-global.service';
import { CompraParcelada } from '../../../compras-parceladas/compra-parcelada.model';
import { ComprasParceladasApiService } from '../../../compras-parceladas/compras-parceladas-api.service';
import { Financiamento } from '../../../financiamentos/financiamento.model';
import { FinanciamentosApiService } from '../../../financiamentos/financiamentos-api.service';
import { Investimento } from '../../../investimentos/investimento.model';
import { InvestimentosApiService } from '../../../investimentos/investimentos-api.service';
import { Recorrencia } from '../../../recorrencias/recorrencia.model';
import { RecorrenciasApiService } from '../../../recorrencias/recorrencias-api.service';
import {
  converterDecimalParaNumero,
  validarDecimalPositivo,
} from '../../../../shared/forms/decimal.validators';

type RecursoPlanejamento =
  'recorrencias' | 'compras-parceladas' | 'investimentos' | 'financiamentos';
type RegistroPlanejamento = Recorrencia | CompraParcelada | Investimento | Financiamento;

export interface FormularioPlanejamentoData {
  readonly recurso: RecursoPlanejamento;
  readonly registro?: RegistroPlanejamento;
}

@Component({
  selector: 'app-formulario-planejamento',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './formulario-planejamento.dialog.html',
  styleUrl: './formulario-planejamento.dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormularioPlanejamentoDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly referenciasApi = inject(ReferenciasFinanceirasApiService);
  private readonly recorrenciasApi = inject(RecorrenciasApiService);
  private readonly comprasApi = inject(ComprasParceladasApiService);
  private readonly investimentosApi = inject(InvestimentosApiService);
  private readonly financiamentosApi = inject(FinanciamentosApiService);
  private readonly dialogRef = inject(MatDialogRef<FormularioPlanejamentoDialogComponent>);
  private readonly destroyRef = inject(DestroyRef);
  private readonly mensagens = inject(MensagemGlobalService);
  protected readonly dados = inject<FormularioPlanejamentoData>(MAT_DIALOG_DATA);

  protected readonly carregandoReferencias = signal(true);
  protected readonly enviando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly contas = signal<readonly ReferenciaFinanceira[]>([]);
  protected readonly categorias = signal<readonly ReferenciaFinanceira[]>([]);
  protected readonly meiosPagamento = signal<readonly ReferenciaFinanceira[]>([]);
  protected readonly formulario = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.maxLength(150)]],
    descricao: ['', [Validators.required, Validators.maxLength(300)]],
    tipo: ['SAIDA', Validators.required],
    valor: ['', [Validators.required, validarDecimalPositivo()]],
    dia: [1, [Validators.required, Validators.min(1), Validators.max(31)]],
    categoriaId: [''],
    contaId: ['', Validators.required],
    meioPagamentoId: [''],
    parcelas: [1, [Validators.required, Validators.min(1)]],
    data: ['', Validators.required],
    juros: ['0', [Validators.required, Validators.pattern(/^\d+(?:[.,]\d+)?$/)]],
    tipoInvestimento: ['RENDA_FIXA', Validators.required],
  });

  protected readonly titulo = this.dados.registro ? 'Editar registro' : this.tituloNovo();

  constructor() {
    this.preencherFormulario();
    forkJoin({
      contas: this.referenciasApi.listar('contas'),
      categorias: this.referenciasApi.listar('categorias'),
      meiosPagamento: this.referenciasApi.listar('meios-pagamento'),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (referencias) => {
          this.contas.set(referencias.contas);
          this.categorias.set(referencias.categorias);
          this.meiosPagamento.set(referencias.meiosPagamento);
          this.carregandoReferencias.set(false);
        },
        error: () => {
          this.erro.set('Não foi possível carregar as opções do formulário.');
          this.carregandoReferencias.set(false);
        },
      });
  }

  protected salvar(): void {
    if (this.formulario.invalid || this.enviando()) {
      this.formulario.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.erro.set(null);
    const valor = this.formulario.getRawValue();
    const numero = (campo: string) =>
      converterDecimalParaNumero(String(valor[campo as keyof typeof valor]).replace('%', '')) ??
      NaN;
    const opcional = (campo: string) => {
      const item = valor[campo as keyof typeof valor];
      return item === '' ? undefined : Number(item);
    };
    const requisicao: Observable<unknown> = (
      this.dados.recurso === 'recorrencias'
        ? this.salvarRecorrencia(valor, numero, opcional)
        : this.dados.recurso === 'compras-parceladas'
          ? this.comprasApi.criar({
              descricao: valor.descricao,
              valorTotal: numero('valor'),
              numeroParcelas: valor.parcelas,
              dataCompra: valor.data,
              categoriaId: opcional('categoriaId'),
              contaId: numero('contaId'),
            })
          : this.dados.recurso === 'investimentos'
            ? this.salvarInvestimento(valor, numero)
            : this.financiamentosApi.criar({
                descricao: valor.descricao,
                principal: numero('valor'),
                taxaJurosMensal: numero('juros'),
                numeroParcelas: valor.parcelas,
                dataInicio: valor.data,
                contaId: numero('contaId'),
              })
    ) as Observable<unknown>;
    requisicao.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.mensagens.sucesso('Registro salvo com sucesso.');
        this.dialogRef.close(true);
      },
      error: () => {
        this.erro.set('Não foi possível salvar o registro. Revise os dados e tente novamente.');
        this.enviando.set(false);
      },
    });
  }

  private salvarRecorrencia(
    valor: ReturnType<typeof this.formulario.getRawValue>,
    numero: (campo: string) => number,
    opcional: (campo: string) => number | undefined,
  ) {
    const requisicao = {
      nome: valor.nome,
      tipo: valor.tipo as Recorrencia['tipo'],
      valorEsperado: numero('valor'),
      diaDoMes: valor.dia,
      categoriaId: opcional('categoriaId'),
      contaId: numero('contaId'),
      meioPagamentoId: opcional('meioPagamentoId'),
    };
    return this.dados.registro
      ? this.recorrenciasApi.atualizar(this.dados.registro.id, requisicao)
      : this.recorrenciasApi.criar(requisicao);
  }

  private salvarInvestimento(
    valor: ReturnType<typeof this.formulario.getRawValue>,
    numero: (campo: string) => number,
  ) {
    const requisicao = {
      nome: valor.nome,
      tipo: valor.tipoInvestimento as Investimento['tipo'],
      contaOrigemId: numero('contaId'),
    };
    return this.dados.registro
      ? this.investimentosApi.atualizar(this.dados.registro.id, requisicao)
      : this.investimentosApi.criar(requisicao);
  }

  private preencherFormulario(): void {
    const registro = this.dados.registro;
    if (!registro) return;
    if (this.dados.recurso === 'recorrencias') {
      const item = registro as Recorrencia;
      this.formulario.patchValue({
        nome: item.nome,
        tipo: item.tipo,
        valor: String(item.valorEsperado),
        dia: item.diaDoMes,
        categoriaId: item.categoriaId ? String(item.categoriaId) : '',
        contaId: String(item.contaId),
        meioPagamentoId: item.meioPagamentoId ? String(item.meioPagamentoId) : '',
      });
    } else if (this.dados.recurso === 'investimentos') {
      const item = registro as Investimento;
      this.formulario.patchValue({
        nome: item.nome,
        tipoInvestimento: item.tipo,
        contaId: String(item.contaOrigemId),
      });
    }
  }

  private tituloNovo(): string {
    return {
      recorrencias: 'Nova recorrência',
      'compras-parceladas': 'Nova compra parcelada',
      investimentos: 'Novo investimento',
      financiamentos: 'Novo financiamento',
    }[this.dados.recurso];
  }
}
