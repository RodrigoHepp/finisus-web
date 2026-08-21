import { CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { Observable, finalize } from 'rxjs';

import { PaginaResponse } from '../../../../core/api/paginacao.model';
import { MensagemGlobalService } from '../../../../core/feedback/mensagem-global.service';
import { CompraParcelada } from '../../../compras-parceladas/compra-parcelada.model';
import { ComprasParceladasApiService } from '../../../compras-parceladas/compras-parceladas-api.service';
import { Financiamento } from '../../../financiamentos/financiamento.model';
import { FinanciamentosApiService } from '../../../financiamentos/financiamentos-api.service';
import { Investimento } from '../../../investimentos/investimento.model';
import { InvestimentosApiService } from '../../../investimentos/investimentos-api.service';
import { Recorrencia } from '../../../recorrencias/recorrencia.model';
import { RecorrenciasApiService } from '../../../recorrencias/recorrencias-api.service';
import { ConfirmacaoDialogComponent } from '../../../../shared/ui/confirmacao/confirmacao-dialog';
import { IndicadorProcessamentoComponent } from '../../../../shared/ui/indicador-processamento/indicador-processamento';
import { PageHeaderComponent } from '../../../../shared/ui/page-header/page-header';
import { PaginacaoComponent } from '../../../../shared/ui/paginacao/paginacao';
import { FormularioPlanejamentoDialogComponent } from '../formulario-planejamento/formulario-planejamento.dialog';

type RecursoPlanejamento =
  'recorrencias' | 'compras-parceladas' | 'investimentos' | 'financiamentos';
type RegistroPlanejamento = Recorrencia | CompraParcelada | Investimento | Financiamento;

interface LinhaPlanejamento {
  readonly id: number;
  readonly nome: string;
  readonly detalhes: string;
  readonly valor?: number;
  readonly status: string;
  readonly registro: RegistroPlanejamento;
}

interface ConfiguracaoRecurso {
  readonly titulo: string;
  readonly descricao: string;
  readonly novo: string;
  readonly vazio: string;
}

const CONFIGURACOES: Record<RecursoPlanejamento, ConfiguracaoRecurso> = {
  recorrencias: {
    titulo: 'Recorrências',
    descricao: 'Planeje lançamentos que se repetem e gere o mês quando estiver pronto.',
    novo: 'Nova recorrência',
    vazio: 'Nenhuma recorrência cadastrada.',
  },
  'compras-parceladas': {
    titulo: 'Compras parceladas',
    descricao: 'Registre compras cujas parcelas devem aparecer nos próximos meses.',
    novo: 'Nova compra parcelada',
    vazio: 'Nenhuma compra parcelada cadastrada.',
  },
  investimentos: {
    titulo: 'Investimentos',
    descricao: 'Organize os investimentos e a conta de origem de cada um.',
    novo: 'Novo investimento',
    vazio: 'Nenhum investimento cadastrado.',
  },
  financiamentos: {
    titulo: 'Financiamentos',
    descricao: 'Acompanhe contratos, parcelas e a situação de cada financiamento.',
    novo: 'Novo financiamento',
    vazio: 'Nenhum financiamento cadastrado.',
  },
};

const PAGINACAO_PADRAO = { pagina: 0, tamanho: 20 };

@Component({
  selector: 'app-lista-planejamento',
  imports: [
    CurrencyPipe,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTableModule,
    IndicadorProcessamentoComponent,
    PageHeaderComponent,
    PaginacaoComponent,
  ],
  templateUrl: './lista-planejamento.page.html',
  styleUrl: './lista-planejamento.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListaPlanejamentoPage {
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  private readonly mensagens = inject(MensagemGlobalService);
  private readonly recorrenciasApi = inject(RecorrenciasApiService);
  private readonly comprasApi = inject(ComprasParceladasApiService);
  private readonly investimentosApi = inject(InvestimentosApiService);
  private readonly financiamentosApi = inject(FinanciamentosApiService);

  protected readonly recurso = this.route.snapshot.data['recurso'] as RecursoPlanejamento;
  protected readonly configuracao = CONFIGURACOES[this.recurso];
  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly dados = signal<PaginaResponse<LinhaPlanejamento>>({
    conteudo: [],
    pagina: 0,
    tamanho: PAGINACAO_PADRAO.tamanho,
    totalElementos: 0,
    totalPaginas: 0,
  });
  protected readonly podeGerar = computed(() => this.recurso === 'recorrencias');
  protected readonly permiteEdicao = computed(
    () => this.recurso === 'recorrencias' || this.recurso === 'investimentos',
  );
  protected readonly colunas = ['nome', 'detalhes', 'valor', 'status', 'acoes'];

  constructor() {
    this.carregar();
  }

  protected abrirFormulario(registro?: RegistroPlanejamento): void {
    this.dialog
      .open(FormularioPlanejamentoDialogComponent, {
        autoFocus: 'dialog',
        panelClass: 'finisus-cadastro-dialog',
        data: { recurso: this.recurso, registro },
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((salvou: boolean | undefined) => {
        if (salvou) this.carregar(this.dados().pagina);
      });
  }

  protected navegarParaPagina(pagina: number): void {
    this.carregar(pagina);
  }

  protected tentarNovamente(): void {
    this.carregar(this.dados().pagina);
  }

  protected gerarMesAtual(): void {
    const anoMes = new Date()
      .toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })
      .slice(0, 7);
    this.recorrenciasApi
      .gerarMes(anoMes)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (transacoes) => {
          this.mensagens.sucesso(
            transacoes.length
              ? `${transacoes.length} lançamento(s) gerado(s) para ${anoMes}.`
              : `Não havia recorrências pendentes para ${anoMes}.`,
          );
        },
        error: () => this.mensagens.erro('Não foi possível gerar os lançamentos deste mês.'),
      });
  }

  protected confirmarEncerramento(linha: LinhaPlanejamento): void {
    const acao = this.recurso === 'investimentos' ? 'inativar' : 'cancelar';
    this.dialog
      .open(ConfirmacaoDialogComponent, {
        data: {
          titulo: `${acao === 'inativar' ? 'Inativar' : 'Cancelar'} registro`,
          mensagem: `Deseja ${acao} “${linha.nome}”?`,
          rotuloConfirmar: acao === 'inativar' ? 'Inativar' : 'Cancelar',
          rotuloCancelar: 'Voltar',
          tom: 'perigoso',
        },
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmado: boolean | undefined) => {
        if (!confirmado) return;
        this.encerrar(linha);
      });
  }

  private carregar(pagina = 0): void {
    this.carregando.set(true);
    this.erro.set(null);
    const parametros = { ...PAGINACAO_PADRAO, pagina };
    const requisicao: Observable<PaginaResponse<RegistroPlanejamento>> = (
      this.recurso === 'recorrencias'
        ? this.recorrenciasApi.listar(parametros)
        : this.recurso === 'compras-parceladas'
          ? this.comprasApi.listar(parametros)
          : this.recurso === 'investimentos'
            ? this.investimentosApi.listar(parametros)
            : this.financiamentosApi.listar(parametros)
    ) as Observable<PaginaResponse<RegistroPlanejamento>>;

    requisicao
      .pipe(
        finalize(() => this.carregando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (paginaResposta: PaginaResponse<RegistroPlanejamento>) =>
          this.dados.set({
            ...paginaResposta,
            conteudo: paginaResposta.conteudo.map((item) => this.mapear(item)),
          }),
        error: () =>
          this.erro.set(
            `Não foi possível carregar ${this.configuracao.titulo.toLocaleLowerCase()}.`,
          ),
      });
  }

  private mapear(registro: RegistroPlanejamento): LinhaPlanejamento {
    if (this.recurso === 'recorrencias') {
      const item = registro as Recorrencia;
      return {
        id: item.id,
        nome: item.nome,
        detalhes: `${item.tipo} · dia ${item.diaDoMes}`,
        valor: item.valorEsperado,
        status: item.ativo ? 'ATIVA' : 'INATIVA',
        registro,
      };
    }
    if (this.recurso === 'compras-parceladas') {
      const item = registro as CompraParcelada;
      return {
        id: item.id,
        nome: item.descricao,
        detalhes: `${item.numeroParcelas} parcela(s) · ${item.dataCompra}`,
        valor: item.valorTotal,
        status: item.canceladaEm ? 'CANCELADA' : 'ATIVA',
        registro,
      };
    }
    if (this.recurso === 'investimentos') {
      const item = registro as Investimento;
      return {
        id: item.id,
        nome: item.nome,
        detalhes: item.tipo.replaceAll('_', ' '),
        status: item.ativo ? 'ATIVO' : 'INATIVO',
        registro,
      };
    }
    const item = registro as Financiamento;
    return {
      id: item.id,
      nome: item.descricao,
      detalhes: `${item.numeroParcelas} parcela(s) · juros ${item.taxaJurosMensal}% a.m.`,
      valor: item.principal,
      status: item.status,
      registro,
    };
  }

  private encerrar(linha: LinhaPlanejamento): void {
    const requisicao: Observable<unknown> = (
      this.recurso === 'recorrencias'
        ? this.recorrenciasApi.inativar(linha.id)
        : this.recurso === 'compras-parceladas'
          ? this.comprasApi.cancelar(linha.id)
          : this.recurso === 'investimentos'
            ? this.investimentosApi.inativar(linha.id)
            : this.financiamentosApi.cancelar(linha.id)
    ) as Observable<unknown>;
    requisicao.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.mensagens.sucesso('Registro atualizado com sucesso.');
        this.carregar(this.dados().pagina);
      },
      error: () => this.mensagens.erro('Não foi possível atualizar este registro.'),
    });
  }
}
