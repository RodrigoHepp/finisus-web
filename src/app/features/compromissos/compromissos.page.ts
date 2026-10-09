import {
  configurarFormularioCompromisso,
  Campo,
  ValorCampo,
  Opcao,
  Tarefa,
} from './formulario-compromisso';
import { CamposCompromissoComponent } from './campos-compromisso.component';
import { mensagemErro } from '../../shared/apresentacao';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import {
  FormArray,
  FormControl,
  FormGroup,
  FormRecord,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subscription, finalize } from 'rxjs';
import {
  Amortizacao,
  Cartao,
  TipoCompromisso,
  PaginaCompromissos,
  CompromissoResponses,
  CompromissosApi,
  ContaElegivel,
  CategoriaElegivel,
  ItemElegivel,
  MeioElegivel,
  Financiamento,
  FinanciamentoRequest,
  ParcelaHistorica,
  Parcela,
  Fatura,
  DetalheFatura,
  TransacaoFatura,
  Obrigacao,
  PagamentoObrigacao,
  Ocorrencia,
  IntencaoPagamento,
} from './compromissos.api';

type Entidade = CompromissoResponses[TipoCompromisso];
type FluxoConsulta =
  'detalhe' | 'pagamentos' | 'faturas' | 'fatura' | 'parcelas' | 'historico' | 'ocorrencias';
const mes = () => new Date().toLocaleDateString('sv-SE').slice(0, 7);

@Component({
  selector: 'fin-compromissos-page',
  standalone: true,
  imports: [
    CamposCompromissoComponent,
    CurrencyPipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressBarModule,
  ],
  templateUrl: './compromissos.page.html',
  styleUrl: './compromissos.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompromissosPage {
  private readonly api = inject(CompromissosApi);
  private readonly referenciaDestruicao = inject(DestroyRef);
  private readonly rota = inject(ActivatedRoute);
  readonly jornadaCartoes = this.rota.snapshot.data['jornada'] === 'cartoes';
  readonly abas: { chave: TipoCompromisso; rotulo: string }[] = this.jornadaCartoes
    ? [
        { chave: 'cartoes', rotulo: 'Cartões' },
        { chave: 'compras', rotulo: 'Compras parceladas' },
      ]
    : [
        { chave: 'obrigacoes', rotulo: 'Contas a pagar' },
        { chave: 'recorrencias', rotulo: 'Recorrências' },
        { chave: 'financiamentos', rotulo: 'Financiamentos' },
      ];
  readonly tipo = signal<TipoCompromisso>(this.jornadaCartoes ? 'cartoes' : 'obrigacoes');
  readonly pagina = signal<PaginaCompromissos<Entidade> | null>(null);
  readonly selecionado = signal<Entidade | null>(null);
  readonly cartao = signal<Cartao | null>(null);
  readonly obrigacao = signal<Obrigacao | null>(null);
  readonly financiamento = signal<Financiamento | null>(null);
  readonly faturas = signal<PaginaCompromissos<Fatura> | null>(null);
  readonly fatura = signal<DetalheFatura | null>(null);
  readonly parcelas = signal<PaginaCompromissos<Parcela> | null>(null);
  readonly historicoParcelas = signal<ParcelaHistorica[] | null>(null);
  readonly pagamentos = signal<PagamentoObrigacao[]>([]);
  readonly ocorrencias = signal<Ocorrencia[] | null>(null);
  readonly contas = signal<ContaElegivel[]>([]);
  readonly categorias = signal<CategoriaElegivel[]>([]);
  readonly meiosPagamento = signal<MeioElegivel[]>([]);
  readonly cartoes = signal<Cartao[]>([]);
  readonly itens = signal<ItemElegivel[]>([]);
  readonly itensDespesa = new FormArray<
    FormGroup<{
      itemId: FormControl<number | null>;
      descricao: FormControl<string | null>;
      quantidade: FormControl<number | null>;
      valor: FormControl<number>;
      categoriaId: FormControl<number | null>;
    }>
  >([]);
  readonly compra = computed(() => {
    const e = this.selecionado();
    return e && 'dataCompra' in e ? e : null;
  });
  readonly recorrencia = computed(() => {
    const e = this.selecionado();
    return e && 'valorEsperado' in e ? e : null;
  });
  private readonly carregandoLista = signal(false);
  private readonly consultasPendentes = signal<ReadonlySet<FluxoConsulta>>(new Set());
  readonly carregando = computed(
    () => this.carregandoLista() || this.consultasPendentes().size > 0,
  );
  readonly ocupado = signal(false);
  readonly erro = signal('');
  readonly sucesso = signal('');
  readonly erroConsultaReferencias = signal('');
  readonly tarefa = signal<Tarefa | null>(null);
  readonly campos = signal<Campo[]>([]);
  readonly tituloTarefa = signal('');
  readonly formulario = new FormRecord<FormControl<ValorCampo>>({});
  readonly controlMes = new FormControl(mes(), {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(/^\d{4}-\d{2}$/)],
  });
  readonly controlVersao = new FormControl<number | null>(null, [
    Validators.required,
    Validators.min(1),
  ]);
  readonly filtros = new FormRecord<FormControl<string>>({
    status: new FormControl('', { nonNullable: true }),
    inicio: new FormControl('', { nonNullable: true }),
    fim: new FormControl('', { nonNullable: true }),
  });
  readonly parcelaSelecionada = signal<Parcela | null>(null);
  readonly amortizacao = signal<Amortizacao | null>(null);
  readonly titulo = computed(
    () => this.abas.find((t) => t.chave === this.tipo())?.rotulo ?? 'Compromissos',
  );
  private readonly intencao = new IntencaoPagamento();
  private versaoConsulta = 0;
  private versaoFatura = 0;
  private readonly consultas = new Map<FluxoConsulta, Subscription>();
  private readonly versoesConsultas = new Map<FluxoConsulta, number>();
  constructor() {
    this.controlMes.valueChanges
      .pipe(takeUntilDestroyed(this.referenciaDestruicao))
      .subscribe(() => {
        this.cancelarConsulta('ocorrencias');
        this.ocorrencias.set(null);
      });
    this.controlVersao.valueChanges
      .pipe(takeUntilDestroyed(this.referenciaDestruicao))
      .subscribe(() => {
        this.cancelarConsulta('historico');
        this.historicoParcelas.set(null);
      });
    this.carregar();
    this.carregarReferencias();
  }
  rotulo(valor: string | null | undefined): string {
    const rotulos: Record<string, string> = {
      ABERTA: 'Aberta',
      FECHADA: 'Fechada',
      PAGA: 'Paga',
      CANCELADA: 'Cancelada',
      EM_ABERTO: 'Em aberto',
      VENCIDA: 'Vencida',
      ATIVO: 'Ativo',
      FINALIZADO: 'Finalizado',
      CANCELADO: 'Cancelado',
      PENDENTE: 'Pendente',
      ATRASADA: 'Atrasada',
      REALIZADA: 'Realizada',
      ENTRADA: 'Receita',
      SAIDA: 'Despesa',
    };
    return valor ? (rotulos[valor] ?? 'Situação não reconhecida') : 'Não informado';
  }
  nome(entidade: Entidade): string {
    return 'nome' in entidade ? entidade.nome : entidade.descricao;
  }
  valor(entidade: Entidade): number {
    return 'limite' in entidade
      ? entidade.limite
      : 'valorTotal' in entidade
        ? entidade.valorTotal
        : 'valorEsperado' in entidade
          ? entidade.valorEsperado
          : 'principal' in entidade
            ? entidade.principal
            : entidade.valor;
  }
  estado(entidade: Entidade): string {
    return 'ativo' in entidade
      ? entidade.ativo
        ? 'Ativo'
        : 'Inativo'
      : 'status' in entidade
        ? this.rotulo(entidade.status)
        : entidade.canceladaEm
          ? 'Cancelada'
          : 'Ativa';
  }
  rotuloValor(): string {
    return this.tipo() === 'cartoes'
      ? 'Limite'
      : this.tipo() === 'recorrencias'
        ? 'Valor esperado'
        : this.tipo() === 'financiamentos'
          ? 'Principal'
          : 'Valor';
  }
  dataCivil(valor: string | null | undefined): string {
    if (!valor) return 'Não informado';
    const parcela = valor.slice(0, 10).split('-');
    return parcela.length === 3 ? `${parcela[2]}/${parcela[1]}/${parcela[0]}` : valor;
  }
  alterarTipo(tipo: TipoCompromisso) {
    if (this.temAlteracoes() && !confirm('Descartar alterações do formulário?')) return;
    this.tipo.set(tipo);
    this.redefinirDetalhe();
    this.carregar();
  }
  private redefinirDetalhe() {
    for (const fluxo of this.versoesConsultas.keys()) this.cancelarConsulta(fluxo);
    this.versaoFatura++;
    this.itensDespesa.clear();
    this.itensDespesa.markAsPristine();
    this.selecionado.set(null);
    this.cartao.set(null);
    this.obrigacao.set(null);
    this.financiamento.set(null);
    this.faturas.set(null);
    this.fatura.set(null);
    this.parcelas.set(null);
    this.historicoParcelas.set(null);
    this.pagamentos.set([]);
    this.ocorrencias.set(null);
    this.tarefa.set(null);
    this.formulario.markAsPristine();
    this.amortizacao.set(null);
  }
  carregar(pagina = 0) {
    const versao = ++this.versaoConsulta;
    this.carregandoLista.set(true);
    this.erro.set('');
    this.api
      .listar(this.tipo(), pagina, this.filtros.getRawValue())
      .pipe(takeUntilDestroyed(this.referenciaDestruicao))
      .subscribe({
        next: (data) => {
          if (versao !== this.versaoConsulta) return;
          this.pagina.set(data);
          this.carregandoLista.set(false);
        },
        error: (e) => {
          if (versao !== this.versaoConsulta) return;
          this.pagina.set(null);
          this.carregandoLista.set(false);
          this.tratarFalha(e);
        },
      });
  }
  private tratarFalha(erro: unknown) {
    this.erro.set(mensagemErro(erro));
  }
  private cancelarConsulta(fluxo: FluxoConsulta) {
    this.versoesConsultas.set(fluxo, (this.versoesConsultas.get(fluxo) ?? 0) + 1);
    this.consultas.get(fluxo)?.unsubscribe();
    this.consultas.delete(fluxo);
    this.consultasPendentes.update((pendencias) => {
      const next = new Set(pendencias);
      next.delete(fluxo);
      return next;
    });
  }
  private consultar<T>(
    fluxo: FluxoConsulta,
    requisicao: Observable<T>,
    aceitar: (data: T) => void,
  ) {
    this.cancelarConsulta(fluxo);
    const versao = this.versoesConsultas.get(fluxo);
    const tipo = this.tipo(),
      idSelecionado = this.selecionado()?.id;
    this.consultasPendentes.update((pendencias) => new Set([...pendencias, fluxo]));
    const atual = () =>
      this.versoesConsultas.get(fluxo) === versao &&
      this.tipo() === tipo &&
      this.selecionado()?.id === idSelecionado;
    const subscription = requisicao
      .pipe(
        takeUntilDestroyed(this.referenciaDestruicao),
        finalize(() => {
          if (this.versoesConsultas.get(fluxo) === versao) {
            this.consultasPendentes.update((pendencias) => {
              const next = new Set(pendencias);
              next.delete(fluxo);
              return next;
            });
          }
        }),
      )
      .subscribe({
        next: (data) => {
          if (atual()) aceitar(data);
        },
        error: (e) => {
          if (atual()) this.tratarFalha(e);
        },
      });
    this.consultas.set(fluxo, subscription);
  }
  private mutacao<T>(
    requisicao: Observable<T>,
    aceitar: (data: T) => void = () => {},
    mensagem = 'Operação concluída.',
  ) {
    if (this.ocupado()) return;
    this.ocupado.set(true);
    this.formulario.disable();
    this.itensDespesa.disable();
    this.erro.set('');
    this.sucesso.set('');
    requisicao
      .pipe(
        takeUntilDestroyed(this.referenciaDestruicao),
        finalize(() => {
          this.ocupado.set(false);
          this.formulario.enable();
          this.itensDespesa.enable();
        }),
      )
      .subscribe({
        next: (data) => {
          this.formulario.markAsPristine();
          this.itensDespesa.markAsPristine();
          this.tarefa.set(null);
          aceitar(data);
          this.sucesso.set(mensagem);
          this.carregar(this.pagina()?.pagina ?? 0);
        },
        error: (e: unknown) => {
          this.tratarFalha(e);
          if (typeof e === 'object' && e !== null && 'status' in e && e.status === 0)
            this.erro.set(
              'A conexão foi interrompida. Consulte o registro e os pagamentos antes de repetir o comando, pois ele pode ter sido concluído.',
            );
        },
      });
  }
  private carregarReferencias() {
    const coletar = <T>(
      consultar: (pagina: number) => Observable<PaginaCompromissos<T>>,
      definir: (data: T[]) => void,
    ) => {
      let todos: T[] = [];
      const next = (p: number) =>
        consultar(p)
          .pipe(takeUntilDestroyed(this.referenciaDestruicao))
          .subscribe({
            next: (data) => {
              todos = todos.concat(data.conteudo);
              definir(todos);
              if (data.pagina + 1 < data.totalPaginas) next(data.pagina + 1);
            },
            error: () =>
              this.erroConsultaReferencias.set(
                'Algumas opções não puderam ser carregadas. Recarregue a página antes de cadastrar. Não usamos dados fictícios.',
              ),
          });
      next(0);
    };
    coletar(
      (p) => this.api.contas(p),
      (d) => this.contas.set(d.filter((v) => v.ativo)),
    );
    coletar(
      (p) => this.api.categorias(p),
      (d) => this.categorias.set(d.filter((v) => v.ativo)),
    );
    coletar(
      (p) => this.api.meiosPagamento(p),
      (d) => this.meiosPagamento.set(d.filter((v) => v.ativo)),
    );
    coletar(
      (p) => this.api.listar('cartoes', p),
      (d) => this.cartoes.set(d.filter((v) => v.ativo)),
    );
    coletar(
      (p) => this.api.itens(p),
      (d) => this.itens.set(d.filter((v) => v.ativo)),
    );
  }
  selecionar(entidade: Entidade) {
    if (this.temAlteracoes() && !confirm('Descartar alterações do formulário?')) return;
    this.redefinirDetalhe();
    this.selecionado.set(entidade);
    const tipo = this.tipo();
    if (tipo === 'cartoes')
      this.consultar('detalhe', this.api.detalhar('cartoes', entidade.id), (d) => {
        this.cartao.set(d);
        this.selecionado.set(d);
        this.carregarFaturas();
      });
    else if (tipo === 'obrigacoes')
      this.consultar('detalhe', this.api.detalhar('obrigacoes', entidade.id), (d) => {
        this.obrigacao.set(d);
        this.selecionado.set(d);
        this.consultar('pagamentos', this.api.listarPagamentosObrigacao(d.id), (p) =>
          this.pagamentos.set(p),
        );
      });
    else if (tipo === 'financiamentos')
      this.consultar('detalhe', this.api.detalhar('financiamentos', entidade.id), (d) => {
        this.financiamento.set(d);
        this.selecionado.set(d);
        this.carregarParcelas();
      });
    else
      this.consultar('detalhe', this.api.detalhar(tipo, entidade.id), (d) =>
        this.selecionado.set(d),
      );
  }
  carregarFaturas(pagina = 0) {
    const cartao = this.cartao();
    this.faturas.set(null);
    if (cartao)
      this.consultar('faturas', this.api.faturas(cartao.id, pagina), (d) => this.faturas.set(d));
  }
  selecionarFatura(fatura: Fatura) {
    if (this.temAlteracoes() && !confirm('Descartar alterações do formulário?')) return;
    this.tarefa.set(null);
    const versao = ++this.versaoFatura;
    this.fatura.set(null);
    this.consultar('fatura', this.api.fatura(fatura.id), (d) => {
      if (versao === this.versaoFatura) this.fatura.set(d);
    });
  }
  carregarParcelas(pagina = 0) {
    const f = this.financiamento();
    this.parcelas.set(null);
    if (f) this.consultar('parcelas', this.api.parcelas(f.id, pagina), (d) => this.parcelas.set(d));
  }
  carregarHistorico() {
    this.cancelarConsulta('historico');
    this.historicoParcelas.set(null);
    const f = this.financiamento(),
      versao = this.controlVersao.value;
    if (!f || !versao || !Number.isInteger(versao) || this.controlVersao.invalid) {
      this.controlVersao.markAsTouched();
      return;
    }
    this.consultar('historico', this.api.historicoParcelas(f.id, versao), (d) =>
      this.historicoParcelas.set(d),
    );
  }
  carregarOcorrencias(gerar = false) {
    this.cancelarConsulta('ocorrencias');
    this.ocorrencias.set(null);
    if (this.controlMes.invalid) {
      this.controlMes.markAsTouched();
      return;
    }
    const m = this.controlMes.value;
    if (gerar) {
      if (!confirm(`Gerar os compromissos de ${m}? Isso ainda não movimenta o caixa.`)) return;
      const tipo = this.tipo(),
        versao = this.versoesConsultas.get('ocorrencias');
      this.mutacao(
        this.api.gerar(m),
        (d) => {
          if (
            this.tipo() === tipo &&
            this.controlMes.value === m &&
            this.versoesConsultas.get('ocorrencias') === versao
          )
            this.ocorrencias.set(d);
        },
        'Compromissos gerados. Nenhum pagamento foi realizado.',
      );
    } else this.consultar('ocorrencias', this.api.ocorrencias(m), (d) => this.ocorrencias.set(d));
  }
  realizar(ocorrencia: Ocorrencia) {
    if (this.carregando() || !this.ocorrencias()?.some((o) => o.id === ocorrencia.id)) return;
    if (!confirm(`Realizar “${ocorrencia.descricao}”? O backend criará a movimentação financeira.`))
      return;
    this.mutacao(
      this.api.realizar(ocorrencia.id),
      () => this.carregarOcorrencias(),
      'Ocorrência realizada.',
    );
  }
  readonly opcoesCampo = (campo: Campo): Opcao[] => this.opcoes(campo);
  opcoes(campo: Campo): Opcao[] {
    if (campo.opcoes) return campo.opcoes;
    if (campo.origem === 'contas')
      return this.contas().map((v) => ({ valor: v.id, rotulo: v.nome }));
    if (campo.origem === 'categorias')
      return this.categorias().map((v) => ({ valor: v.id, rotulo: v.nome }));
    if (campo.origem === 'meios-pagamento')
      return this.meiosPagamento().map((v) => ({ valor: v.id, rotulo: v.nome }));
    if (campo.origem === 'cartoes')
      return this.cartoes().map((v) => ({ valor: v.id, rotulo: v.nome }));
    return [];
  }
  iniciar(tarefa: Tarefa, titulo: string, parcela?: Parcela) {
    if (this.temAlteracoes() && !confirm('Descartar alterações do formulário?')) return;
    this.parcelaSelecionada.set(parcela ?? null);
    this.tituloTarefa.set(titulo);
    this.tarefa.set(tarefa);
    const campos = configurarFormularioCompromisso(
      this.formulario,
      tarefa,
      this.tipo(),
      this.selecionado(),
      this.fatura(),
    );
    this.itensDespesa.clear();
    this.itensDespesa.markAsPristine();
    this.campos.set(campos);
    this.formulario.markAsPristine();
    setTimeout(() => document.getElementById('titulo-formulario-compromisso')?.focus());
  }
  cancelarFormulario() {
    if (this.temAlteracoes() && !confirm('Descartar alterações do formulário?')) return;
    this.tarefa.set(null);
    this.formulario.markAsPristine();
    this.itensDespesa.markAsPristine();
  }
  temAlteracoes(): boolean {
    return this.formulario.dirty || this.itensDespesa.dirty;
  }
  adicionarItemDespesa() {
    this.itensDespesa.push(
      new FormGroup({
        itemId: new FormControl<number | null>(null),
        descricao: new FormControl<string | null>(null, Validators.maxLength(300)),
        quantidade: new FormControl<number | null>(null, Validators.min(0.000001)),
        valor: new FormControl(0, {
          nonNullable: true,
          validators: [Validators.required, Validators.min(0.01)],
        }),
        categoriaId: new FormControl<number | null>(null),
      }),
    );
    this.itensDespesa.markAsDirty();
  }
  removerItemDespesa(indice: number) {
    this.itensDespesa.removeAt(indice);
    this.itensDespesa.markAsDirty();
  }
  private numeroCampo(chave: string): number {
    return Number(this.formulario.controls[chave]?.value);
  }
  private valorOpcional(chave: string): number | null {
    const v = this.formulario.controls[chave]?.value;
    return v === null || v === undefined || v === '' ? null : Number(v);
  }
  private textoCampo(chave: string): string {
    return String(this.formulario.controls[chave]?.value ?? '').trim();
  }
  private payloadFinanciamento(): FinanciamentoRequest {
    return {
      descricao: this.textoCampo('descricao'),
      principal: this.numeroCampo('principal'),
      taxaJurosMensal: this.numeroCampo('taxaJurosMensal'),
      numeroParcelas: this.numeroCampo('numeroParcelas'),
      dataInicio: this.textoCampo('dataInicio'),
      contaId: this.numeroCampo('contaId'),
    };
  }
  enviar() {
    if (this.ocupado()) return;
    if (
      this.formulario.invalid ||
      (this.tarefa() === 'despesa-fatura' && this.itensDespesa.invalid)
    ) {
      this.formulario.markAllAsTouched();
      this.itensDespesa.markAllAsTouched();
      return;
    }
    const tarefa = this.tarefa(),
      id = this.selecionado()?.id,
      i = this.fatura(),
      f = this.financiamento();
    if (!confirm(`${this.tituloTarefa()}? Confirme os dados antes de continuar.`)) return;
    if (tarefa === 'criar' || tarefa === 'editar') {
      const tipo = this.tipo();
      if (tipo === 'cartoes') {
        const corpo = {
          nome: this.textoCampo('nome'),
          limite: this.numeroCampo('limite'),
          diaFechamento: this.numeroCampo('diaFechamento'),
          diaVencimento: this.numeroCampo('diaVencimento'),
        };
        this.mutacao(
          tarefa === 'editar' && id
            ? this.api.atualizarCartao(id, corpo)
            : this.api.criar('cartoes', corpo),
          (d) => {
            this.carregarReferencias();
            this.selecionar(d);
          },
        );
      }
      if (tipo === 'compras')
        this.mutacao(
          this.api.criar('compras', {
            descricao: this.textoCampo('descricao'),
            valorTotal: this.numeroCampo('valorTotal'),
            numeroParcelas: this.numeroCampo('numeroParcelas'),
            dataCompra: this.textoCampo('dataCompra'),
            categoriaId: this.valorOpcional('categoriaId'),
            contaId: this.numeroCampo('contaId'),
            cartaoId: this.valorOpcional('cartaoId'),
          }),
        );
      if (tipo === 'obrigacoes')
        this.mutacao(
          this.api.criar('obrigacoes', {
            descricao: this.textoCampo('descricao'),
            credor: this.textoCampo('credor'),
            valor: this.numeroCampo('valor'),
            dataVencimento: this.textoCampo('dataVencimento'),
            contaPagamentoId: this.numeroCampo('contaPagamentoId'),
            categoriaId: this.valorOpcional('categoriaId'),
          }),
        );
      if (tipo === 'recorrencias') {
        const corpo = {
          nome: this.textoCampo('nome'),
          tipo: this.textoCampo('tipo') === 'ENTRADA' ? ('ENTRADA' as const) : ('SAIDA' as const),
          valorEsperado: this.numeroCampo('valorEsperado'),
          diaDoMes: this.numeroCampo('diaDoMes'),
          categoriaId: this.valorOpcional('categoriaId'),
          contaId: this.numeroCampo('contaId'),
          meioPagamentoId: this.valorOpcional('meioPagamentoId'),
        };
        this.mutacao(
          tarefa === 'editar' && id
            ? this.api.atualizarRecorrencia(id, corpo)
            : this.api.criar('recorrencias', corpo),
          (d) => this.selecionar(d),
        );
      }
      if (tipo === 'financiamentos')
        this.mutacao(this.api.criar('financiamentos', this.payloadFinanciamento()));
    }
    if (tarefa === 'criar-fatura' && this.cartao())
      this.mutacao(
        this.api.criarFatura({
          cartaoId: this.cartao()!.id,
          anoMes: this.textoCampo('anoMes'),
          dataFechamento: this.textoCampo('dataFechamento'),
          dataVencimento: this.textoCampo('dataVencimento'),
          contaPagamentoId: this.numeroCampo('contaPagamentoId'),
        }),
        () => this.carregarFaturas(),
      );
    if (tarefa === 'editar-fatura' && i)
      this.mutacao(
        this.api.atualizarFatura(i.id, {
          dataFechamento: this.textoCampo('dataFechamento'),
          dataVencimento: this.textoCampo('dataVencimento'),
          contaPagamentoId: this.numeroCampo('contaPagamentoId'),
        }),
        () => this.selecionarFatura(i),
      );
    if (tarefa === 'despesa-fatura' && i)
      this.mutacao(
        this.api.registrarDespesaFatura(i.id, {
          descricao: this.textoCampo('descricao'),
          valor: this.numeroCampo('valor'),
          data: this.textoCampo('data'),
          contaId: this.numeroCampo('contaId'),
          categoriaId: this.valorOpcional('categoriaId'),
          itens: this.itensDespesa.getRawValue(),
        }),
        () => this.selecionarFatura(i),
      );
    if (tarefa === 'pagar-fatura' && i) {
      const corpo = {
        dataPagamento: this.textoCampo('dataPagamento'),
        valor: this.valorOpcional('valor'),
        contaId: this.valorOpcional('contaId'),
      };
      this.mutacao(
        this.api.pagarFatura(i.id, corpo, this.intencao.obterChave(i.id, corpo)),
        () => {
          this.intencao.concluir();
          this.selecionarFatura(i);
          this.carregarFaturas();
        },
        'Pagamento registrado. Confira o valor em aberto e o crédito informado pelo servidor.',
      );
    }
    if (tarefa === 'ciclos')
      this.mutacao(
        this.api.processarCiclosFatura(this.textoCampo('dataReferencia')),
        (d) => {
          this.sucesso.set(`${d.fechadas.length} faturas fechadas e ${d.criadas.length} criadas.`);
          this.carregarFaturas();
        },
        'Ciclos processados.',
      );
    if (tarefa === 'pagar-obrigacao' && id)
      this.mutacao(
        this.api.pagarObrigacao(id, {
          dataPagamento: this.textoCampo('dataPagamento'),
          valor: this.valorOpcional('valor'),
          juros: this.valorOpcional('juros'),
          encargos: this.valorOpcional('encargos'),
          desconto: this.valorOpcional('desconto'),
        }),
        (d) => this.selecionar(d),
      );
    if (tarefa === 'pagar-parcela' && f && this.parcelaSelecionada())
      this.mutacao(
        this.api.pagarParcela(
          f.id,
          this.parcelaSelecionada()!.id,
          this.textoCampo('dataPagamento'),
        ),
        () => this.carregarParcelas(),
      );
    if (tarefa === 'amortizar' && f) {
      const modalidade = this.textoCampo('modalidade');
      this.mutacao(
        this.api.amortizar(f.id, {
          valor: this.numeroCampo('valor'),
          dataPagamento: this.textoCampo('dataPagamento'),
          numeroParcelasRestantes: this.valorOpcional('numeroParcelasRestantes'),
          modalidade:
            modalidade === 'REDUZIR_PRAZO'
              ? 'REDUZIR_PRAZO'
              : modalidade === 'REDUZIR_PRESTACAO'
                ? 'REDUZIR_PRESTACAO'
                : null,
        }),
        (d) => {
          this.selecionar(d.financiamento);
          this.amortizacao.set(d);
        },
      );
    }
    if (tarefa === 'refinanciar' && f)
      this.mutacao(
        this.api.refinanciar(f.id, this.numeroCampo('parcelaId'), this.payloadFinanciamento()),
        (d) => {
          this.selecionar(d.novoFinanciamento);
        },
        'Refinanciamento registrado. O cronograma foi calculado pelo servidor.',
      );
  }
  inativarEntidade() {
    const selecionado = this.selecionado(),
      tipo = this.tipo();
    if (!selecionado || !confirm(`Inativar “${this.nome(selecionado)}”?`)) return;
    if (tipo === 'cartoes' || tipo === 'recorrencias')
      this.mutacao(this.api.inativar(tipo, selecionado.id), () => {
        this.redefinirDetalhe();
        this.carregarReferencias();
      });
  }
  cancelarEntidade() {
    const selecionado = this.selecionado(),
      tipo = this.tipo();
    if (
      !selecionado ||
      !confirm(
        `Cancelar “${this.nome(selecionado)}”? O servidor verificará os vínculos e pagamentos.`,
      )
    )
      return;
    if (tipo === 'compras' || tipo === 'obrigacoes' || tipo === 'financiamentos')
      this.mutacao(this.api.cancelar(tipo, selecionado.id), () => this.redefinirDetalhe());
  }
  executarComandoFatura(comando: 'fechar' | 'estornar-pagamento' | 'cancelar') {
    const i = this.fatura();
    if (
      !i ||
      !confirm(
        `${comando === 'fechar' ? 'Fechar' : comando === 'cancelar' ? 'Cancelar' : 'Estornar o último pagamento de'} esta fatura?`,
      )
    )
      return;
    this.mutacao(this.api.executarComandoFatura(i.id, comando), () => {
      this.selecionarFatura(i);
      this.carregarFaturas();
    });
  }
  estornarObrigacao(pagamento: PagamentoObrigacao | null) {
    const o = this.obrigacao();
    if (
      !o ||
      !confirm(
        pagamento
          ? 'Estornar este pagamento e atualizar o saldo da obrigação?'
          : 'Estornar todos os pagamentos ativos desta obrigação?',
      )
    )
      return;
    this.mutacao(this.api.estornarPagamentoObrigacao(o.id, pagamento?.id ?? null), (d) =>
      this.selecionar(d),
    );
  }
  comandoParcela(p: Parcela, comando: 'estornar' | 'corrigir-erro' | 'finalizar') {
    const f = this.financiamento();
    if (
      !f ||
      !confirm(
        comando === 'corrigir-erro'
          ? 'Excluir esta parcela por erro de lançamento? O cronograma será recalculado pelo servidor.'
          : comando === 'finalizar'
            ? 'Finalizar este financiamento por refinanciamento a partir desta parcela?'
            : 'Estornar o pagamento desta parcela?',
      )
    )
      return;
    if (comando === 'estornar')
      this.mutacao(this.api.estornarParcela(f.id, p.id), () => this.carregarParcelas());
    if (comando === 'corrigir-erro')
      this.mutacao(this.api.removerParcelaIncorreta(f.id, p.id), () => this.carregarParcelas());
    if (comando === 'finalizar')
      this.mutacao(this.api.finalizarParcela(f.id, p.id), () => this.selecionar(f));
  }
  nomeTransacao(t: TransacaoFatura): string {
    return t.descricao;
  }
}
