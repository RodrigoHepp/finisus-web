import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import {
  Pagina,
  TipoInvestimento,
  TipoMovimentoInvestimento,
} from '../../infraestrutura/api/backend.dtos';
import { formatarDataCivil, formatarMoeda, hoje } from '../../shared/apresentacao';
import {
  InvestimentosApi,
  Investimento,
  MovimentoInvestimento,
  PosicaoInvestimento,
  OpcaoConta,
} from './investimentos.api';
import { IMPORTS_JORNADA, EstadoJornada } from '../../shared/jornada.ui';
@Component({
  selector: 'fin-investimentos',
  standalone: true,
  imports: IMPORTS_JORNADA,
  templateUrl: './investimentos.page.html',
  styleUrl: '../../shared/jornada.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvestimentosPage extends EstadoJornada {
  private geracaoSelecao = 0;
  private geracaoLista = 0;
  private geracaoContas = 0;
  private geracaoMovimentos = 0;
  private geracaoPosicoes = 0;
  private readonly api = inject(InvestimentosApi);
  private readonly fb = inject(FormBuilder);
  readonly formatarMoeda = formatarMoeda;
  readonly dataCivil = formatarDataCivil;
  readonly tipos: { valor: TipoInvestimento; rotulo: string }[] = [
    { valor: 'RENDA_FIXA', rotulo: 'Renda fixa' },
    { valor: 'RENDA_VARIAVEL', rotulo: 'Renda variável' },
    { valor: 'FUNDO', rotulo: 'Fundo' },
    { valor: 'CRIPTO', rotulo: 'Criptoativos' },
    { valor: 'OUTRO', rotulo: 'Outro' },
  ];
  readonly tiposMovimento: { valor: TipoMovimentoInvestimento; rotulo: string }[] = [
    { valor: 'APORTE', rotulo: 'Aporte' },
    { valor: 'RESGATE', rotulo: 'Resgate' },
    { valor: 'RENDIMENTO_REALIZADO', rotulo: 'Rendimento realizado' },
    { valor: 'TAXA', rotulo: 'Taxa' },
  ];
  readonly listar = signal<Pagina<Investimento> | null>(null);
  readonly selecionado = signal<Investimento | null>(null);
  readonly movimentos = signal<Pagina<MovimentoInvestimento> | null>(null);
  readonly posicoes = signal<Pagina<PosicaoInvestimento> | null>(null);
  readonly contas = signal<OpcaoConta[]>([]);
  readonly paginaContas = signal(0);
  readonly totalPaginasContas = signal(0);
  readonly editando = signal<number | undefined>(undefined);
  readonly mostrarFormulario = signal(false);
  readonly formulario = this.fb.group({
    nome: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(150),
      Validators.pattern(/\S/),
    ]),
    tipo: this.fb.nonNullable.control<TipoInvestimento>('RENDA_FIXA', Validators.required),
    contaOrigemId: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
    contaCustodiaId: this.fb.control<number | null>(null, Validators.min(1)),
  });
  readonly formularioMovimento = this.fb.nonNullable.group({
    tipo: this.fb.nonNullable.control<TipoMovimentoInvestimento>('APORTE', Validators.required),
    valor: [0, [Validators.required, Validators.min(0.01)]],
    data: [hoje(), Validators.required],
  });
  readonly formularioPosicao = this.fb.nonNullable.group({
    valor: [0, [Validators.required, Validators.min(0)]],
    dataReferencia: [hoje(), Validators.required],
  });
  constructor() {
    super();
    this.carregar();
    this.carregarContas();
  }
  temAlteracoes(): boolean {
    return this.formulario.dirty || this.formularioMovimento.dirty || this.formularioPosicao.dirty;
  }
  tipo(valor: TipoInvestimento) {
    return this.tipos.find((tipo) => tipo.valor === valor)?.rotulo ?? 'Tipo não reconhecido';
  }
  tipoMovimento(valor: TipoMovimentoInvestimento) {
    return (
      this.tiposMovimento.find((tipo) => tipo.valor === valor)?.rotulo ?? 'Tipo não reconhecido'
    );
  }
  carregar(event?: PageEvent): void {
    const geracao = ++this.geracaoLista;
    this.listar.set(null);
    this.executar(this.api.listar(event?.pageIndex ?? 0, event?.pageSize ?? 20), (pagina) => {
      if (geracao === this.geracaoLista) this.listar.set(pagina);
    });
  }
  carregarContas(pagina = 0): void {
    const geracao = ++this.geracaoContas;
    this.executar(this.api.contas(pagina), (valor) => {
      if (geracao !== this.geracaoContas) return;
      this.contas.set(valor.conteudo.filter((conta) => conta.ativo));
      this.paginaContas.set(valor.pagina);
      this.totalPaginasContas.set(valor.totalPaginas);
    });
  }
  criar(): void {
    if (this.salvando()) return;
    const abrir = () => {
      this.editando.set(undefined);
      this.formulario.reset({
        nome: '',
        tipo: 'RENDA_FIXA',
        contaOrigemId: null,
        contaCustodiaId: null,
      });
      this.mostrarFormulario.set(true);
    };
    if (this.mostrarFormulario() && this.formulario.dirty)
      this.confirmar('Descartar as alterações e iniciar outro investimento?', abrir);
    else abrir();
  }
  editar(item: Investimento): void {
    if (this.salvando()) return;
    const abrir = () => {
      this.editando.set(item.id);
      this.formulario.reset({
        nome: item.nome,
        tipo: item.tipo,
        contaOrigemId: item.contaOrigemId,
        contaCustodiaId: item.contaCustodiaId,
      });
      this.mostrarFormulario.set(true);
    };
    if (this.mostrarFormulario() && this.formulario.dirty)
      this.confirmar('Descartar as alterações e editar este investimento?', abrir);
    else abrir();
  }
  salvar(): void {
    this.formulario.markAllAsTouched();
    const valor = this.formulario.getRawValue();
    if (this.formulario.invalid || valor.contaOrigemId === null) return;
    if (valor.contaOrigemId === valor.contaCustodiaId) {
      this.erro.set('A conta de custódia deve ser diferente da origem.');
      return;
    }
    this.executar(
      this.api.salvar({ ...valor, contaOrigemId: valor.contaOrigemId }, this.editando()),
      (item) => {
        this.editando.set(item.id);
        if (JSON.stringify(this.formulario.getRawValue()) === JSON.stringify(valor)) {
          this.formulario.markAsPristine();
          this.mostrarFormulario.set(false);
        }
        this.carregar();
        if (!this.formularioMovimento.dirty && !this.formularioPosicao.dirty)
          this.abrirSelecao(item.id);
      },
      true,
    );
  }
  selecionar(id: number): void {
    if (this.salvando()) return;
    if (this.formularioMovimento.dirty || this.formularioPosicao.dirty) {
      this.confirmar(
        'Descartar o movimento ou a posição em edição e consultar outro investimento?',
        () => this.abrirSelecao(id),
      );
    } else this.abrirSelecao(id);
  }
  private abrirSelecao(id: number): void {
    this.formularioMovimento.reset({ tipo: 'APORTE', valor: 0, data: hoje() });
    this.formularioPosicao.reset({ valor: 0, dataReferencia: hoje() });
    this.selecionado.set(null);
    this.movimentos.set(null);
    this.posicoes.set(null);
    const geracao = ++this.geracaoSelecao;
    this.executar(this.api.consultar(id), (item) => {
      if (geracao !== this.geracaoSelecao) return;
      this.selecionado.set(item);
      this.carregarMovimentos();
      this.carregarPosicoes();
    });
  }
  carregarMovimentos(event?: PageEvent): void {
    const item = this.selecionado();
    if (!item) return;
    const geracao = ++this.geracaoMovimentos;
    const selecao = this.geracaoSelecao;
    this.movimentos.set(null);
    this.executar(
      this.api.movimentos(item.id, event?.pageIndex ?? 0, event?.pageSize ?? 20),
      (pagina) => {
        if (
          selecao === this.geracaoSelecao &&
          geracao === this.geracaoMovimentos &&
          this.selecionado()?.id === item.id
        )
          this.movimentos.set(pagina);
      },
    );
  }
  carregarPosicoes(event?: PageEvent): void {
    const item = this.selecionado();
    if (!item) return;
    const geracao = ++this.geracaoPosicoes;
    const selecao = this.geracaoSelecao;
    this.posicoes.set(null);
    this.executar(
      this.api.posicoes(item.id, event?.pageIndex ?? 0, event?.pageSize ?? 20),
      (pagina) => {
        if (
          selecao === this.geracaoSelecao &&
          geracao === this.geracaoPosicoes &&
          this.selecionado()?.id === item.id
        )
          this.posicoes.set(pagina);
      },
    );
  }
  inativar(item: Investimento): void {
    this.confirmar(`Inativar ${item.nome}? O histórico será preservado.`, () =>
      this.executar(
        this.api.inativar(item.id),
        () => {
          this.carregar();
          if (this.selecionado()?.id === item.id) this.abrirSelecao(item.id);
        },
        true,
      ),
    );
  }
  registrarMovimento(): void {
    const item = this.selecionado();
    this.formularioMovimento.markAllAsTouched();
    if (!item || this.formularioMovimento.invalid) return;
    const enviado = this.formularioMovimento.getRawValue();
    const corpo = { investimentoId: item.id, ...enviado };
    this.confirmar(
      'Registrar este movimento real de investimento? A operação poderá movimentar a conta de origem.',
      () =>
        this.executar(
          this.api.registrarMovimento(corpo),
          () => {
            if (JSON.stringify(this.formularioMovimento.getRawValue()) === JSON.stringify(enviado))
              this.formularioMovimento.reset({ tipo: 'APORTE', valor: 0, data: hoje() });
            this.carregarMovimentos();
          },
          true,
        ),
    );
  }
  estornar(item: MovimentoInvestimento): void {
    this.confirmar('Estornar o movimento e os efeitos financeiros vinculados?', () =>
      this.executar(this.api.estornar(item.id), () => this.carregarMovimentos(), true),
    );
  }
  registrarPosicao(): void {
    const item = this.selecionado();
    this.formularioPosicao.markAllAsTouched();
    if (!item || this.formularioPosicao.invalid) return;
    const enviado = this.formularioPosicao.getRawValue();
    this.executar(
      this.api.registrarPosicao(item.id, enviado),
      () => {
        if (JSON.stringify(this.formularioPosicao.getRawValue()) === JSON.stringify(enviado))
          this.formularioPosicao.markAsPristine();
        this.carregarPosicoes();
      },
      true,
    );
  }
}
