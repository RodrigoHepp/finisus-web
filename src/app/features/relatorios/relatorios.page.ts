import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ActivatedRoute } from '@angular/router';
import { Subject, catchError, of, switchMap } from 'rxjs';
import { VisaoFinanceiraComponent } from '../../shared/visao-financeira.component';
import { mensagemErro, hoje } from '../../shared/apresentacao';
import { Relatorio, RelatoriosApi } from './relatorios.api';
@Component({
  selector: 'fin-relatorios-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatPaginatorModule,
    VisaoFinanceiraComponent,
  ],
  templateUrl: './relatorios.page.html',
})
export class RelatoriosPage {
  private readonly api = inject(RelatoriosApi);
  private readonly referenciaDestruicao = inject(DestroyRef);
  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef, { optional: true });
  private readonly solicitacoes = new Subject<boolean>();
  readonly relatorios: { id: Relatorio; rotulo: string; orientacao: string }[] = [
    {
      id: 'visao-geral',
      rotulo: 'Visão geral',
      orientacao:
        'Saldo livre desconta compromissos na janela consultada. Compromissos futuros ainda não são caixa realizado.',
    },
    {
      id: 'mensal',
      rotulo: 'Resultado mensal',
      orientacao:
        'Competência acompanha o consumo e as receitas do mês; caixa acompanha pagamentos efetivos. Compra e pagamento de fatura têm significados diferentes.',
    },
    {
      id: 'periodo',
      rotulo: 'Resumo por período',
      orientacao: 'Totais consolidados pelo servidor no período selecionado.',
    },
    {
      id: 'anual',
      rotulo: 'Resultado anual',
      orientacao: 'Resultados mensais e totais anuais por competência e caixa.',
    },
    {
      id: 'composicao',
      rotulo: 'Composição anual',
      orientacao: 'Origens financeiras e categorias consolidadas pelo servidor.',
    },
    {
      id: 'balancete',
      rotulo: 'Balancete mensal',
      orientacao: 'Os totais pertencem à consulta completa; os registros são paginados.',
    },
    {
      id: 'balancete-anual',
      rotulo: 'Balancete anual',
      orientacao: 'Filtros aplicados no servidor. Os totais não são a soma da página.',
    },
    {
      id: 'agenda',
      rotulo: 'Agenda de compromissos',
      orientacao: 'Vencimentos previstos não representam pagamentos realizados.',
    },
    {
      id: 'patrimonio',
      rotulo: 'Patrimônio',
      orientacao:
        'Patrimônio considera posições e dívidas. Capital investido e custódia não são somados novamente pelo navegador.',
    },
    {
      id: 'compartilhados',
      rotulo: 'Valores compartilhados',
      orientacao: 'Valores a compensar entre participantes não representam dinheiro já recebido.',
    },
    {
      id: 'analise',
      rotulo: 'Receitas e gastos',
      orientacao: 'Transferências, aportes e resgates não são receitas ou despesas operacionais.',
    },
    {
      id: 'previsao',
      rotulo: 'Previsão de fluxo de caixa',
      orientacao: 'Projeções calculadas pelo servidor; geração de previsões não movimenta saldo.',
    },
  ];
  readonly selecionado = signal<Relatorio>(
    inject(ActivatedRoute).snapshot.data['jornada'] === 'relatorios' ? 'mensal' : 'visao-geral',
  );
  readonly dados = signal<unknown>(null);
  readonly erro = signal('');
  readonly carregando = signal(false);
  readonly recalculando = signal(false);
  readonly ocupado = computed(() => this.carregando() || this.recalculando());
  readonly rotuloResultado = signal('');
  readonly contextoResultado = signal('');
  readonly sucesso = signal('');
  readonly pagina = signal(0);
  readonly total = signal(0);
  readonly avisoHistorico = signal(false);
  readonly formulario = inject(FormBuilder).nonNullable.group({
    referencia: [hoje(), Validators.required],
    inicio: [hoje().slice(0, 7) + '-01', Validators.required],
    fim: [hoje(), Validators.required],
    anoMes: [hoje().slice(0, 7), Validators.required],
    ano: [hoje().slice(0, 4), [Validators.required, Validators.pattern(/^\d{4}$/)]],
    periodoMeses: [
      3,
      [Validators.required, Validators.min(1), Validators.max(12), Validators.pattern(/^\d+$/)],
    ],
    janelaDias: [
      30,
      [Validators.required, Validators.min(1), Validators.max(90), Validators.pattern(/^\d+$/)],
    ],
    tipo: [''],
    categoriaId: ['', Validators.pattern(/^\d*$/)],
    contaId: ['', Validators.pattern(/^\d*$/)],
  });
  constructor() {
    this.solicitacoes
      .pipe(
        switchMap((valido) => {
          this.carregando.set(valido);
          this.erro.set('');
          this.dados.set(null);
          this.total.set(0);
          this.avisoHistorico.set(false);
          const relatorio = this.selecionado();
          const filtros = this.formulario.getRawValue();
          this.rotuloResultado.set(this.relatorios.find((r) => r.id === relatorio)?.rotulo ?? '');
          this.contextoResultado.set(
            relatorio === 'visao-geral' || relatorio === 'patrimonio'
              ? `Referência: ${filtros.referencia}`
              : relatorio === 'agenda' || relatorio === 'compartilhados'
                ? `Período: ${filtros.inicio} a ${filtros.fim}`
                : ['anual', 'composicao', 'balancete-anual'].includes(relatorio)
                  ? `Ano: ${filtros.ano}`
                  : `Competência / mês final: ${filtros.anoMes}`,
          );
          return valido
            ? this.api.consultar(relatorio, filtros, this.pagina()).pipe(
                catchError((err: unknown) => {
                  this.erro.set(mensagemErro(err));
                  return of(null);
                }),
              )
            : of(null);
        }),
        takeUntilDestroyed(this.referenciaDestruicao),
      )
      .subscribe((valor) => {
        this.dados.set(valor);
        this.carregando.set(false);
        this.avisoHistorico.set(
          !!valor &&
            'patrimonioHistoricoCompleto' in valor &&
            valor.patrimonioHistoricoCompleto === false,
        );
        const p =
          valor && 'linhas' in valor
            ? valor.linhas
            : valor && 'totalElementos' in valor
              ? valor
              : null;
        this.total.set(p?.totalElementos ?? 0);
      });
    this.solicitacoes.next(true);
  }
  orientacao() {
    return this.relatorios.find((r) => r.id === this.selecionado())?.orientacao;
  }
  carregar(redefinir = true) {
    this.formulario.markAllAsTouched();
    if (redefinir) this.pagina.set(0);
    const valido = this.filtrosValidos();
    this.solicitacoes.next(valido);
    if (!valido) this.focarFiltroInvalido();
  }
  private focarFiltroInvalido() {
    this.elemento?.nativeElement
      .querySelector<HTMLElement>('input.ng-invalid, mat-select.ng-invalid')
      ?.focus();
  }
  private filtrosValidos(): boolean {
    const relatorio = this.selecionado();
    const campos: Record<Relatorio, (keyof typeof this.formulario.controls)[]> = {
      'visao-geral': ['referencia', 'janelaDias'],
      patrimonio: ['referencia'],
      agenda: ['inicio', 'fim'],
      compartilhados: ['inicio', 'fim'],
      mensal: ['anoMes'],
      periodo: ['anoMes', 'periodoMeses'],
      anual: ['ano'],
      composicao: ['ano'],
      balancete: ['anoMes', 'tipo', 'categoriaId', 'contaId'],
      'balancete-anual': ['ano', 'tipo', 'categoriaId', 'contaId'],
      analise: ['anoMes', 'periodoMeses'],
      previsao: ['anoMes', 'periodoMeses'],
    };
    return campos[relatorio].every((chave) => this.formulario.controls[chave].valid);
  }
  selecionar(relatorio: Relatorio) {
    this.selecionado.set(relatorio);
    this.carregar();
  }
  paginar(event: PageEvent) {
    this.pagina.set(event.pageIndex);
    this.carregar(false);
  }
  recalcular() {
    this.formulario.markAllAsTouched();
    if (this.recalculando()) return;
    if (!this.filtrosValidos()) {
      this.focarFiltroInvalido();
      return;
    }
    this.recalculando.set(true);
    this.erro.set('');
    this.api
      .recalcular(this.formulario.controls.periodoMeses.value)
      .pipe(takeUntilDestroyed(this.referenciaDestruicao))
      .subscribe({
        next: () => {
          this.recalculando.set(false);
          this.sucesso.set('Previsão recalculada pelo servidor.');
          if (this.selecionado() === 'previsao') this.carregar();
        },
        error: (e: unknown) => {
          this.recalculando.set(false);
          this.erro.set(mensagemErro(e));
        },
      });
  }
}
