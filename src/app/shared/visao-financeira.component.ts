import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { formatarDataCivil, formatarMoeda, status } from './apresentacao';
const rotulos: Record<string, string> = {
  referencia: 'Data de referência',
  anoMes: 'Competência',
  ano: 'Ano',
  mesInicial: 'Competência inicial',
  mesFinal: 'Competência final',
  periodoMeses: 'Meses do período',
  inicio: 'Início',
  fim: 'Fim',
  saldoContas: 'Saldo das contas',
  resultadoCompetenciaOperacional: 'Resultado operacional por competência',
  resultadoCompetencia: 'Resultado por competência',
  resultadoCaixa: 'Resultado de caixa',
  comprometidoNaJanela: 'Compromissos futuros na janela',
  saldoLivreNaJanela: 'Saldo livre na janela',
  maioresGastos: 'Maiores gastos por categoria',
  alertas: 'Pontos de atenção',
  categoriaId: 'Identificação da categoria',
  categoria: 'Categoria',
  categoriaNome: 'Categoria',
  valor: 'Valor',
  descricao: 'Descrição',
  vencimento: 'Vencimento',
  nivel: 'Nível de atenção',
  tipo: 'Tipo',
  totalComprometido: 'Total de compromissos',
  compromissos: 'Compromissos previstos',
  referenciaId: 'Identificação do compromisso',
  situacao: 'Situação',
  saldosEDividasConsultadosEm: 'Saldos e dívidas consultados em',
  patrimonioHistoricoCompleto: 'Histórico patrimonial integral',
  capitalLiquidoInvestido: 'Capital líquido investido',
  valorAtualInvestimentos: 'Valor das posições de investimentos',
  faturasEmAberto: 'Faturas em aberto',
  obrigacoesEmAberto: 'Obrigações em aberto',
  parcelasFinanciamentoEmAberto: 'Parcelas de financiamento em aberto',
  principalFinanciamentosEmAberto: 'Principal dos financiamentos',
  jurosEncargosFinanciamentosFuturos: 'Juros e encargos futuros',
  parcelasFinanciamentoSemComposicao: 'Parcelas sem composição informada',
  comprasParceladasRestantes: 'Compras parceladas restantes',
  dividasPrincipais: 'Dívidas principais',
  dividasECompromissos: 'Dívidas e compromissos',
  patrimonioLiquido: 'Patrimônio líquido',
  investimentos: 'Posições dos investimentos',
  investimentoId: 'Identificação do investimento',
  investimento: 'Investimento',
  capitalLiquido: 'Capital líquido',
  valorAtual: 'Valor da posição',
  dataPosicao: 'Data da posição',
  posicaoInformada: 'Posição manual informada',
  aReceber: 'Valores a compensar a receber',
  aPagar: 'Valores a compensar a pagar',
  divisoes: 'Divisões do período',
  divisaoId: 'Identificação da divisão',
  divisao: 'Divisão',
  total: 'Total informado pelo servidor',
  meuPago: 'Minha contribuição paga',
  meuDevido: 'Minha responsabilidade',
  meuSaldo: 'Meu saldo de compensação',
  participantes: 'Participantes',
  usuarioId: 'Identificação do participante',
  nomeExibicao: 'Participante',
  pago: 'Pago',
  devido: 'Responsabilidade',
  saldo: 'Saldo',
  receitasOperacionais: 'Receitas operacionais',
  gastosDeConsumo: 'Gastos de consumo',
  resultadoOperacional: 'Resultado operacional',
  despesasFixasPrevistas: 'Despesas fixas previstas',
  categorias: 'Categorias',
  receitas: 'Receitas',
  despesas: 'Despesas',
  gastosDiretos: 'Gastos diretos',
  gastosFaturas: 'Compras por competência das faturas',
  valorFaturasPago: 'Pagamentos efetivos de fatura',
  valorFaturasEmAberto: 'Faturas em aberto',
  situacaoCompetencia: 'Situação por competência',
  situacaoCaixa: 'Situação de caixa',
  resumo: 'Resumo do mês',
  totais: 'Totais do servidor',
  origens: 'Origens',
  origem: 'Origem financeira',
  pagamentosFaturas: 'Pagamentos efetivos de faturas',
  meses: 'Resultados mensais',
  linhas: 'Movimentações do balancete',
  conteudo: 'Registros da página',
  pagina: 'Índice da página',
  tamanho: 'Registros por página',
  totalElementos: 'Quantidade total de registros',
  totalPaginas: 'Quantidade de páginas',
  id: 'Identificação',
  data: 'Data',
  contaId: 'Identificação da conta',
  faturaId: 'Identificação da fatura',
  entrada: 'Entradas previstas',
  saida: 'Saídas previstas',
};
const camposMonetarios = new Set(
  'saldoContas resultadoCompetenciaOperacional resultadoCompetencia resultadoCaixa comprometidoNaJanela saldoLivreNaJanela valor totalComprometido capitalLiquidoInvestido valorAtualInvestimentos faturasEmAberto obrigacoesEmAberto parcelasFinanciamentoEmAberto principalFinanciamentosEmAberto jurosEncargosFinanciamentosFuturos parcelasFinanciamentoSemComposicao comprasParceladasRestantes dividasPrincipais dividasECompromissos patrimonioLiquido capitalLiquido valorAtual aReceber aPagar total meuPago meuDevido meuSaldo pago devido saldo receitasOperacionais gastosDeConsumo resultadoOperacional despesasFixasPrevistas receitas despesas gastosDiretos gastosFaturas valorFaturasPago valorFaturasEmAberto pagamentosFaturas entrada saida'.split(
    ' ',
  ),
);
@Component({
  selector: 'fin-visao-financeira',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@if (ehArray(valor())) {
      @if (itens().length === 0) {
        <p class="vazio">Nenhum registro neste período.</p>
      }
      @for (item of itens(); track $index) {
        <article class="registro"><fin-visao-financeira [valor]="item" /></article>
      }
    } @else {
      <dl class="grade-financeira">
        @for (entrada of entradas(); track entrada.chave) {
          @if (entrada.rotulo) {
            <div [class.aninhado]="ehObjeto(entrada.valor)">
              <dt>{{ entrada.rotulo }}</dt>
              <dd>
                @if (ehObjeto(entrada.valor)) {
                  <fin-visao-financeira [valor]="entrada.valor" />
                } @else {
                  {{ formatar(entrada.chave, entrada.valor) }}
                }
              </dd>
            </div>
          }
        }
      </dl>
    }`,
  styles: `
    .grade-financeira {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1.2rem;
      margin: 0;
    }
    dt {
      font-size: 0.82rem;
      color: var(--texto-secundario);
      margin-bottom: 0.3rem;
    }
    dd {
      margin: 0;
      font-weight: 600;
      overflow-wrap: anywhere;
    }
    .aninhado {
      grid-column: 1/-1;
    }
    .registro {
      padding: 1rem 0;
      border-bottom: 1px solid var(--borda);
    }
    .vazio {
      color: var(--texto-secundario);
      font-weight: 400;
    }
  `,
})
export class VisaoFinanceiraComponent {
  readonly valor = input<unknown>();
  ehArray = Array.isArray;
  ehObjeto(valor: unknown): boolean {
    return valor !== null && typeof valor === 'object';
  }
  itens(): unknown[] {
    const v = this.valor();
    return Array.isArray(v) ? v : [];
  }
  entradas(): { chave: string; rotulo: string | undefined; valor: unknown }[] {
    const v = this.valor();
    return v && typeof v === 'object'
      ? Object.entries(v).map(([chave, valor]) => ({ chave, rotulo: rotulos[chave], valor }))
      : [];
  }
  formatar(chave: string, valor: unknown): string {
    if (valor == null) return 'Não informado';
    if (typeof valor === 'number' && camposMonetarios.has(chave)) return formatarMoeda(valor);
    if (typeof valor === 'boolean') return valor ? 'Sim' : 'Não';
    if (
      typeof valor === 'string' &&
      ['situacao', 'situacaoCompetencia', 'situacaoCaixa', 'tipo', 'origem', 'nivel'].includes(
        chave,
      )
    )
      return status(valor);
    if (typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}/.test(valor))
      return formatarDataCivil(valor);
    if (typeof valor === 'string' && valor.startsWith('DASHBOARD.'))
      return 'Atenção às condições financeiras do período';
    return String(valor);
  }
}
