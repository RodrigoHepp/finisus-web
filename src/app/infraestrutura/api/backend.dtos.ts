// DTOs HTTP do checkout. Não recalcular valores financeiros. Datas são strings civis/ISO.
export type OrigemLinha = 'DIRETA' | 'FATURA' | 'PAGAMENTO_FATURA';
export type SituacaoResultado = 'POSITIVO' | 'NEGATIVO' | 'NEUTRO';
export type OrigemResumo =
  | 'MOVIMENTACAO_DIRETA'
  | 'RECORRENCIA'
  | 'COMPRA_PARCELADA'
  | 'CARTAO'
  | 'PAGAMENTO_FATURA'
  | 'INVESTIMENTO';
export type NivelDuplicidade = 'EXATA' | 'PROVAVEL';
export type DecisaoRevisaoImportacao =
  'CRIAR' | 'IGNORAR' | 'ASSOCIAR_TRANSACAO' | 'ASSOCIAR_OBRIGACAO';
export type EstadoLancamentoImportado = 'PENDENTE' | 'IGNORADA' | 'ASSOCIADA' | 'CRIADA';
export type ModalidadeAmortizacaoFinanciamento = 'REDUZIR_PRAZO' | 'REDUZIR_PRESTACAO';
export type ModalidadeCompartilhamentoItem = 'INTEGRAL' | 'QUANTIDADE' | 'PERCENTUAL' | 'VALOR';
export type PermissaoUsuario = 'USUARIO_CADASTRAR' | 'USUARIO_DESBLOQUEAR';
export type Tipo = 'ANONIMIZACAO';
export type Status = 'SOLICITADA' | 'EM_ANALISE' | 'CONCLUIDA' | 'RECUSADA';
export type StatusDivisaoCompartilhada = 'ATIVA' | 'INATIVA';
export type StatusFatura = 'ABERTA' | 'FECHADA' | 'PAGA' | 'CANCELADA';
export type StatusFinanciamento = 'ATIVO' | 'FINALIZADO' | 'CANCELADO';
export type StatusImportacaoFinanceira = 'PENDENTE_REVISAO' | 'CONFIRMADA';
export type StatusObrigacaoFinanceira = 'EM_ABERTO' | 'PAGA' | 'VENCIDA' | 'CANCELADA';
export type StatusOcorrenciaRecorrencia = 'PENDENTE' | 'REALIZADA';
export type StatusPagamentoDivisao = 'PENDENTE' | 'PARCIAL' | 'QUITADO';
export type StatusParcelaFinanciamento = 'PENDENTE' | 'PAGA' | 'ATRASADA';
export type StatusSnapshotDivisao = 'CONFIRMADO' | 'PENDENTE_REVISAO';
export type StatusTransferencia = 'ATIVA' | 'ESTORNADA';
export type TipoConta = 'FISICO' | 'CORRENTE' | 'POUPANCA' | 'APLICACAO';
export type TipoDocumentoFinanceiro = 'EXTRATO_CONTA' | 'FATURA_CARTAO' | 'COBRANCA';
export type TipoInvestimento = 'RENDA_FIXA' | 'RENDA_VARIAVEL' | 'FUNDO' | 'CRIPTO' | 'OUTRO';
export type TipoMovimentoInvestimento = 'APORTE' | 'RESGATE' | 'RENDIMENTO_REALIZADO' | 'TAXA';
export type TipoTransacao = 'ENTRADA' | 'SAIDA';
export interface RevisaoEstado {
  data: string;
  descricao: string;
  valor: number;
  tipo: TipoTransacao;
  importar: boolean;
  categoriaId: number | null;
  itemId: number | null;
  transacaoId: number | null;
  obrigacaoFinanceiraId: number | null;
}
export type { Transacao as TransacaoHttp } from './contratos-http';
export interface Pagina<T> {
  conteudo: T[];
  pagina: number;
  tamanho: number;
  totalElementos: number;
  totalPaginas: number;
}
export type AuthCadastroRequest = import('./contratos-http').CadastroUsuario;
export interface AuthLoginRequest {
  email: string;
  senha: string;
}
export interface AuthRefreshRequest {
  refreshToken: string;
}
export type AuthUsuarioResponse = import('./contratos-http').UsuarioCadastrado;
export type AuthTokenResponse = import('./contratos-http').TokensSessao;
export type BancoRequest = import('./contratos-http').BancoInput;
export type BancoResponse = import('./contratos-http').Banco;
export type CartaoCreditoRequest = import('./contratos-http').CartaoRequest;
export type CartaoCreditoResponse = import('./contratos-http').Cartao;
export type CategoriaRequest = import('./contratos-http').CategoriaInput;
export type CategoriaResponse = import('./contratos-http').Categoria;
export type CompraParceladaRequest = import('./contratos-http').CompraRequest;
export type CompraParceladaResponse = import('./contratos-http').Compra;
export interface ConfiguracaoCompartilhamentoOptInRequest {
  aceita: boolean;
}
export interface ConfiguracaoCompartilhamentoConfigResponse {
  aceita: boolean;
}
export type ContaRequest = import('./contratos-http').ContaRequest;
export type ContaResponse = import('./contratos-http').Conta;
export type ContaReconciliacaoResponse = import('./contratos-http').Reconciliacao;
export interface ContaAjusteSaldoRequest {
  saldoInformado: number;
  motivo: string;
}
export type ContaAjusteSaldoResponse = import('./contratos-http').Ajuste;
export interface DashboardFinanceiroMensalResponse {
  anoMes: string | null;
  resumo: DashboardFinanceiroResumoResponse | null;
  categorias: Array<DashboardFinanceiroCategoriaResponse>;
}
export interface DashboardFinanceiroResumoResponse {
  receitas: number | null;
  gastosDiretos: number | null;
  gastosFaturas: number | null;
  valorFaturasPago: number | null;
  valorFaturasEmAberto: number | null;
  resultadoCompetencia: number | null;
  resultadoCaixa: number | null;
  situacaoCompetencia: string | null;
  situacaoCaixa: string | null;
}
export interface DashboardFinanceiroResumoPeriodoResponse {
  mesInicial: string | null;
  mesFinal: string | null;
  periodoMeses: number;
  totais: DashboardFinanceiroTotaisPeriodoResponse | null;
  origens: Array<DashboardFinanceiroOrigemResumoResponse>;
}
export interface DashboardFinanceiroTotaisPeriodoResponse {
  receitas: number | null;
  despesas: number | null;
  pagamentosFaturas: number | null;
  resultadoCompetencia: number | null;
  resultadoCaixa: number | null;
}
export interface DashboardFinanceiroResumoAnualResponse {
  ano: string | null;
  meses: Array<DashboardFinanceiroResumoMesResponse>;
  totais: DashboardFinanceiroTotaisResponse | null;
}
export interface DashboardFinanceiroResumoMesResponse {
  anoMes: string | null;
  receitas: number | null;
  gastosDiretos: number | null;
  gastosFaturas: number | null;
  pagamentosFaturas: number | null;
  resultadoCompetencia: number | null;
  resultadoCaixa: number | null;
}
export interface DashboardFinanceiroComposicaoAnualResponse {
  ano: string | null;
  totais: DashboardFinanceiroTotaisPeriodoResponse | null;
  origens: Array<DashboardFinanceiroOrigemResumoResponse>;
  categorias: Array<DashboardFinanceiroCategoriaResponse>;
}
export interface DashboardFinanceiroOrigemResumoResponse {
  origem: string | null;
  receitas: number | null;
  despesas: number | null;
  pagamentosFaturas: number | null;
}
export interface DashboardFinanceiroCategoriaResponse {
  categoriaId: number | null;
  categoriaNome: string | null;
  receitas: number | null;
  despesas: number | null;
  saldo: number | null;
}
export interface DashboardFinanceiroBalanceteResponse {
  linhas: Pagina<DashboardFinanceiroLinhaResponse> | null;
  totais: DashboardFinanceiroTotaisResponse | null;
}
export interface DashboardFinanceiroLinhaResponse {
  id: number | null;
  data: string | null;
  descricao: string | null;
  tipo: TipoTransacao | null;
  valor: number | null;
  contaId: number | null;
  categoriaId: number | null;
  categoriaNome: string | null;
  origem: string | null;
  faturaId: number | null;
}
export interface DashboardFinanceiroTotaisResponse {
  receitas: number | null;
  gastosDiretos: number | null;
  gastosFaturas: number | null;
  pagamentosFaturas: number | null;
  resultadoCompetencia: number | null;
  resultadoCaixa: number | null;
}
export interface DivisaoCompartilhadaCriarRequest {
  nome: string;
  participantes: Array<DivisaoCompartilhadaParticipanteRequest>;
}
export interface DivisaoCompartilhadaParticipantesRequest {
  participantes: Array<DivisaoCompartilhadaParticipanteRequest>;
}
export type DivisaoCompartilhadaParticipanteRequest = import('./contratos-http').Participante;
export interface DivisaoCompartilhadaAssociarTransacaoRequest {
  transacaoId: number | null;
  baseCompartilhada: number | null;
  responsabilidades: Array<DivisaoCompartilhadaResponsabilidadeRequest>;
}
export interface DivisaoCompartilhadaRevisarResponsabilidadesRequest {
  responsabilidades: Array<DivisaoCompartilhadaResponsabilidadeRequest>;
}
export type DivisaoCompartilhadaResponsabilidadeRequest =
  import('./contratos-http').Responsabilidade;
export type DivisaoCompartilhadaVinculoPendenteResponse =
  import('./contratos-http').AssociacaoPendente;
export type DivisaoCompartilhadaDivisaoResponse = import('./contratos-http').DivisaoCompartilhada;
export type DivisaoCompartilhadaParticipanteResponse = import('./contratos-http').Participante;
export type DivisaoCompartilhadaHistoricoParticipanteResponse =
  import('./contratos-http').HistoricoParticipante;
export type DivisaoCompartilhadaAlocacaoPagamentoResponse = import('./contratos-http').Alocacao;
export interface DivisaoCompartilhadaAlocacoesPagamentoRequest {
  alocacoes: Array<DivisaoCompartilhadaAlocacaoPagamentoRequest>;
}
export interface DivisaoCompartilhadaAlocacaoPagamentoRequest {
  transacaoId: number;
  valor: number;
}
export type DivisaoCompartilhadaResumoPagamentoResponse =
  import('./contratos-http').PagamentoDivisao;
export interface DivisaoCompartilhadaReembolsoRequest {
  transacaoId: number;
  recebedorId: number;
  valor: number;
}
export type DivisaoCompartilhadaReembolsoResponse = import('./contratos-http').Reembolso;
export type DivisaoCompartilhadaResumoResponse = import('./contratos-http').ResumoDivisao;
export type DivisaoCompartilhadaResumoParticipanteResponse =
  import('./contratos-http').ParticipanteResumo;
export type FaturaRequest = import('./contratos-http').FaturaRequest;
export type FaturaGastoRequest = import('./contratos-http').DespesaFatura;
export type FaturaItemRequest = import('./contratos-http').ItemDespesa;
export type FaturaPagamentoRequest = import('./contratos-http').PagamentoFatura;
export interface FaturaCicloRequest {
  dataReferencia: string;
}
export interface FaturaAtualizarRequest {
  dataFechamento: string;
  dataVencimento: string;
  contaPagamentoId: number;
}
export type FaturaResponse = import('./contratos-http').Fatura;
export type FaturaDetalheResponse = import('./contratos-http').DetalheFatura;
export type FaturaCicloResponse = import('./contratos-http').CicloFaturas;
export type FinanciamentoRequest = import('./contratos-http').FinanciamentoRequest;
export interface FinanciamentoRefinanciamentoRequest {
  parcelaId: number;
  novoFinanciamento: FinanciamentoRequest;
}
export type FinanciamentoRefinanciamentoResponse = import('./contratos-http').Refinanciamento;
export type FinanciamentoAmortizacaoRequest = import('./contratos-http').AmortizacaoRequest;
export type FinanciamentoAmortizacaoResponse = import('./contratos-http').Amortizacao;
export type FinanciamentoParcelaHistoricaResponse = import('./contratos-http').ParcelaHistorica;
export type FinanciamentoResponse = import('./contratos-http').Financiamento;
export type ImportacaoFinanceiraRevisarRequest = import('./contratos-http').RevisaoImportacaoInput;
export type ImportacaoFinanceiraLancamentoRequest =
  import('./contratos-http').RevisaoLancamentoInput;
export type ImportacaoFinanceiraRevisaoResponse = import('./contratos-http').RevisaoImportacao;
export type ImportacaoFinanceiraDivergenciaResponse =
  import('./contratos-http').DivergenciaImportacao;
export type ImportacaoFinanceiraPossivelDuplicidadeResponse =
  import('./contratos-http').DuplicidadeImportacao;
export type ImportacaoFinanceiraImportacaoResponse = import('./contratos-http').DocumentoImportacao;
export type ImportacaoFinanceiraLancamentoResponse = import('./contratos-http').LancamentoImportado;
export type ImportacaoFinanceiraRevisaoLancamentoResponse =
  import('./contratos-http').RevisaoLancamento;
export type InvestimentoRequest = import('./contratos-http').InvestimentoInput;
export type InvestimentoResponse = import('./contratos-http').Investimento;
export type ItemRequest = import('./contratos-http').ItemInput;
export type ItemResponse = import('./contratos-http').Item;
export type MeioPagamentoRequest = import('./contratos-http').MeioInput;
export type MeioPagamentoResponse = import('./contratos-http').Meio;
export type MovimentoInvestimentoRequest = import('./contratos-http').MovimentoInvestimentoInput;
export type MovimentoInvestimentoResponse = import('./contratos-http').MovimentoInvestimento;
export type ObrigacaoFinanceiraRequest = import('./contratos-http').ObrigacaoRequest;
export type ObrigacaoFinanceiraPagamentoRequest =
  import('./contratos-http').PagamentoObrigacaoRequest;
export type ObrigacaoFinanceiraResponse = import('./contratos-http').Obrigacao;
export type ObrigacaoFinanceiraPagamentoResponse = import('./contratos-http').PagamentoObrigacao;
export interface PainelFinanceiroVisaoGeralResponse {
  referencia: string | null;
  saldoContas: number | null;
  resultadoCompetenciaOperacional: number | null;
  resultadoCaixa: number | null;
  comprometidoNaJanela: number | null;
  saldoLivreNaJanela: number | null;
  maioresGastos: Array<PainelFinanceiroCategoriaGastoResponse>;
  alertas: Array<PainelFinanceiroAlertaResponse>;
}
export interface PainelFinanceiroCategoriaGastoResponse {
  categoriaId: number | null;
  categoria: string | null;
  valor: number | null;
}
export interface PainelFinanceiroAlertaResponse {
  tipo: string | null;
  descricao: string | null;
  vencimento: string | null;
  valor: number | null;
  nivel: string | null;
}
export interface PainelFinanceiroAgendaResponse {
  inicio: string | null;
  fim: string | null;
  totalComprometido: number | null;
  compromissos: Array<PainelFinanceiroCompromissoResponse>;
}
export interface PainelFinanceiroCompromissoResponse {
  tipo: string | null;
  referenciaId: number | null;
  descricao: string | null;
  vencimento: string | null;
  valor: number | null;
  situacao: string | null;
}
export interface PainelFinanceiroPatrimonioResponse {
  referencia: string | null;
  saldosEDividasConsultadosEm: string | null;
  patrimonioHistoricoCompleto: boolean;
  saldoContas: number | null;
  capitalLiquidoInvestido: number | null;
  valorAtualInvestimentos: number | null;
  faturasEmAberto: number | null;
  obrigacoesEmAberto: number | null;
  parcelasFinanciamentoEmAberto: number | null;
  principalFinanciamentosEmAberto: number | null;
  jurosEncargosFinanciamentosFuturos: number | null;
  parcelasFinanciamentoSemComposicao: number | null;
  comprasParceladasRestantes: number | null;
  dividasPrincipais: number | null;
  dividasECompromissos: number | null;
  patrimonioLiquido: number | null;
  investimentos: Array<PainelFinanceiroPosicaoInvestimentoResponse>;
}
export interface PainelFinanceiroPosicaoInvestimentoResponse {
  investimentoId: number | null;
  investimento: string | null;
  tipo: string | null;
  capitalLiquido: number | null;
  valorAtual: number | null;
  dataPosicao: string | null;
  posicaoInformada: boolean;
}
export interface PainelFinanceiroCompartilhadosResponse {
  inicio: string | null;
  fim: string | null;
  aReceber: number | null;
  aPagar: number | null;
  divisoes: Array<PainelFinanceiroResumoDivisaoCompartilhadaResponse>;
}
export interface PainelFinanceiroResumoDivisaoCompartilhadaResponse {
  divisaoId: number | null;
  divisao: string | null;
  total: number | null;
  meuPago: number | null;
  meuDevido: number | null;
  meuSaldo: number | null;
  participantes: Array<PainelFinanceiroParticipanteCompartilhadoResponse>;
}
export interface PainelFinanceiroParticipanteCompartilhadoResponse {
  usuarioId: number | null;
  nomeExibicao: string | null;
  pago: number | null;
  devido: number | null;
  saldo: number | null;
}
export interface PainelFinanceiroAnaliseReceitasGastosResponse {
  mesInicial: string | null;
  mesFinal: string | null;
  periodoMeses: number;
  receitasOperacionais: number | null;
  gastosDeConsumo: number | null;
  resultadoOperacional: number | null;
  despesasFixasPrevistas: number | null;
  categorias: Array<PainelFinanceiroCategoriaAnaliseResponse>;
}
export interface PainelFinanceiroCategoriaAnaliseResponse {
  categoriaId: number | null;
  categoria: string | null;
  receitas: number | null;
  despesas: number | null;
  saldo: number | null;
}
export type ParcelaFinanciamentoRefinanciamentoResponse =
  import('./contratos-http').RefinanciamentoParcelas;
export interface ParcelaFinanciamentoPagamentoRequest {
  dataPagamento: string;
}
export type ParcelaFinanciamentoResponse = import('./contratos-http').Parcela;
export interface PerfilUsuarioRequest {
  nome: string;
  email: string;
}
export interface PerfilUsuarioResponse {
  id: number | null;
  nome: string | null;
  email: string | null;
  ativo: boolean;
}
export interface PerfilUsuarioSolicitacaoRequest {
  motivo: string;
}
export interface PerfilUsuarioExportacaoResponse {
  versaoFormato: number;
  geradaEm: string | null;
  secoes: Record<string, Array<Record<string, unknown>>> | null;
}
export interface PerfilUsuarioSolicitacaoResponse {
  id: number | null;
  tipo: string | null;
  status: string | null;
  motivo: string | null;
  solicitadaEm: string | null;
  concluidaEm: string | null;
  observacao: string | null;
}
export interface PosicaoInvestimentoRequest {
  valor: number;
  dataReferencia: string;
}
export type PosicaoInvestimentoResponse = import('./contratos-http').PosicaoInvestimento;
export interface PrevisaoFluxoCaixaResponse {
  anoMes: string | null;
  categoriaId: number | null;
  entrada: number | null;
  saida: number | null;
}
export type RecorrenciaRequest = import('./contratos-http').RecorrenciaRequest;
export type RecorrenciaResponse = import('./contratos-http').Recorrencia;
export type RecorrenciaOcorrenciaResponse = import('./contratos-http').Ocorrencia;
export type TransacaoRequest = import('./contratos-http').TransacaoRequest;
export interface TransacaoCorrecaoRequest {
  tipo: TipoTransacao;
  valor: number;
  data: string;
  descricao: string;
  contaId: number;
  categoriaId: number | null;
  meioPagamentoId: number | null;
  itens: Array<TransacaoItemRequest>;
  motivo: string;
}
export interface TransacaoDetalhamentoRequest {
  itens: Array<TransacaoItemRequest>;
  motivo: string;
}
export type TransacaoItemRequest = import('./contratos-http').TransacaoItemRequest;
export type TransacaoHistoricoResponse = import('./contratos-http').Historico;
export type TransferenciaContaRequest = import('./contratos-http').TransferenciaRequest;
export type TransferenciaContaResponse = import('./contratos-http').Transferencia;
export type TransacaoResponseTransacaoResponse = import('./contratos-http').Transacao;
export type TransacaoResponseItemResponse = import('./contratos-http').TransacaoItemResponse;
