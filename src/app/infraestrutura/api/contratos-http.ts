// Contratos refinados a partir dos records e mappers backend. Sem cálculos locais.
// Nomes públicos existentes são aliases; APIs e geração usam estas mesmas definições.
import type {
  Pagina,
  TipoConta as BackendTipoConta,
  TipoInvestimento,
  TipoMovimentoInvestimento,
  TipoDocumentoFinanceiro,
  TipoTransacao,
  DecisaoRevisaoImportacao,
  EstadoLancamentoImportado,
  RevisaoEstado,
} from './backend.dtos';

export type PaginaHttp<T> = Pagina<T>;

export interface Banco {
  id: number;
  nome: string;
  codigo: string;
  sistema: boolean;
}

export interface Categoria {
  id: number;
  nome: string;
  categoriaPaiId: number | null;
  ativo: boolean;
}

export interface Item {
  id: number;
  nome: string;
  categoriaPadraoId: number | null;
  ativo: boolean;
}

export interface Meio {
  id: number;
  nome: string;
  ativo: boolean;
}

export type TipoConta = BackendTipoConta;

export interface Conta {
  id: number;
  nome: string;
  tipo: TipoConta;
  bancoId: number | null;
  saldo: number;
  ativo: boolean;
}

export interface ContaRequest {
  nome: string;
  tipo: TipoConta;
  bancoId: number | null;
}

export interface Reconciliacao {
  contaId: number;
  saldoMaterializado: number;
  saldoCalculado: number;
  divergencia: number;
  quantidadeMovimentos: number;
  quantidadeAjustes: number;
  conciliado: boolean;
}

export interface Ajuste {
  id: number;
  contaId: number;
  saldoAnterior: number;
  saldoCalculadoAnterior: number;
  saldoInformado: number;
  valorAjuste: number;
  motivo: string;
  dataAjuste: string;
}

export interface TransferenciaRequest {
  contaOrigemId: number;
  contaDestinoId: number;
  valor: number;
  data: string;
  descricao: string;
}

export interface Transferencia extends TransferenciaRequest {
  id: number;
  status: 'ATIVA' | 'ESTORNADA';
  estornadaEm: string | null;
}

export interface TransacaoItemRequest {
  itemId: number | null;
  descricao: string | null;
  quantidade: number | null;
  valor: number;
  categoriaId: number | null;
}

export interface TransacaoRequest {
  tipo: 'ENTRADA' | 'SAIDA';
  valor: number;
  data: string;
  descricao: string;
  contaId: number;
  categoriaId: number | null;
  meioPagamentoId: number | null;
  itens: TransacaoItemRequest[];
}

export interface Transacao extends TransacaoRequest {
  id: number;
  itens: (TransacaoItemRequest & { id: number })[];
}

export interface Historico {
  id: number;
  campoAlterado: string;
  valorAnterior: string | null;
  valorNovo: string | null;
  alteradoPor: number;
  alteradoEm: string;
  motivo: string | null;
  correlacaoId: string | null;
  snapshotAnterior: string | null;
  snapshotNovo: string | null;
}

export type TipoCadastro = 'bancos' | 'categorias' | 'itens' | 'meios-pagamento';

export type Cadastro = Banco | Categoria | Item | Meio;

export interface CadastroRequests {
  bancos: { nome: string; codigo: string };
  categorias: { nome: string; categoriaPaiId: number | null };
  itens: { nome: string; categoriaPadraoId: number | null };
  'meios-pagamento': { nome: string };
}

export interface CadastroResponses {
  bancos: Banco;
  categorias: Categoria;
  itens: Item;
  'meios-pagamento': Meio;
}

export type PaginaCompromissos<T> = Pagina<T>;

export interface CartaoRequest {
  nome: string;
  limite: number;
  diaFechamento: number;
  diaVencimento: number;
}

export interface Cartao extends CartaoRequest {
  id: number;
  ativo: boolean;
}

export interface FaturaRequest {
  cartaoId: number;
  anoMes: string;
  dataFechamento: string;
  dataVencimento: string;
  contaPagamentoId: number;
}

export interface Fatura {
  id: number;
  cartaoId: number;
  anoMes: string;
  fechamento: string;
  vencimento: string;
  status: 'ABERTA' | 'FECHADA' | 'PAGA' | 'CANCELADA';
  contaPagamentoId: number;
}

export interface PagamentoFatura {
  valor: number | null;
  dataPagamento: string;
  contaId: number | null;
}

export interface DespesaFatura {
  valor: number;
  data: string;
  descricao: string;
  contaId: number;
  categoriaId: number | null;
  itens: ItemDespesa[];
}

export type ItemDespesa = TransacaoItemRequest;

export type TransacaoFatura = Transacao;

export interface DetalheFatura extends Fatura {
  valorTotal: number;
  valorPago: number;
  creditoAplicado: number;
  valorEmAberto: number;
  credito: number;
  transacoes: TransacaoFatura[];
}

export interface CicloFaturas {
  fechadas: Fatura[];
  criadas: Fatura[];
}

export interface CompraRequest {
  descricao: string;
  valorTotal: number;
  numeroParcelas: number;
  dataCompra: string;
  categoriaId: number | null;
  contaId: number;
  cartaoId: number | null;
}

export interface Compra extends CompraRequest {
  id: number;
  canceladaEm: string | null;
}

export interface ObrigacaoRequest {
  descricao: string;
  credor: string;
  valor: number;
  dataVencimento: string;
  contaPagamentoId: number;
  categoriaId: number | null;
}

export interface Obrigacao extends ObrigacaoRequest {
  id: number;
  status: 'EM_ABERTO' | 'PAGA' | 'VENCIDA' | 'CANCELADA';
  dataLiquidacao: string | null;
  transacaoId: number | null;
  valorPago: number;
  saldoPendente: number;
}

export interface PagamentoObrigacaoRequest {
  dataPagamento: string;
  valor: number | null;
  juros: number | null;
  encargos: number | null;
  desconto: number | null;
}

export interface PagamentoObrigacao {
  id: number;
  transacaoId: number;
  valor: number;
  juros: number;
  encargos: number;
  desconto: number;
  valorAbatido: number;
  valorCaixa: number;
  dataPagamento: string;
  estornadoEm: string | null;
}

export interface RecorrenciaRequest {
  nome: string;
  tipo: 'ENTRADA' | 'SAIDA';
  valorEsperado: number;
  diaDoMes: number;
  categoriaId: number | null;
  contaId: number;
  meioPagamentoId: number | null;
}

export interface Recorrencia extends RecorrenciaRequest {
  id: number;
  ativo: boolean;
}

export interface Ocorrencia {
  id: number;
  recorrenciaId: number;
  anoMes: string;
  vencimento: string;
  tipo: 'ENTRADA' | 'SAIDA';
  valor: number;
  descricao: string;
  contaId: number;
  categoriaId: number | null;
  meioPagamentoId: number | null;
  status: 'PENDENTE' | 'REALIZADA';
  transacaoId: number | null;
}

export interface FinanciamentoRequest {
  descricao: string;
  principal: number;
  taxaJurosMensal: number;
  numeroParcelas: number;
  dataInicio: string;
  contaId: number;
}

export interface Financiamento extends FinanciamentoRequest {
  id: number;
  status: 'ATIVO' | 'FINALIZADO' | 'CANCELADO';
  cronogramaVersao: number;
  financiamentoOrigemId: number | null;
}

export interface Parcela {
  id: number;
  numero: number;
  valor: number;
  principal: number | null;
  juros: number | null;
  encargos: number | null;
  saldoDevedorInicial: number | null;
  saldoDevedorFinal: number | null;
  vencimento: string;
  status: 'PENDENTE' | 'PAGA' | 'ATRASADA';
  transacaoId: number | null;
}

export interface ParcelaHistorica {
  parcelaIdOrigem: number;
  numero: number;
  valor: number;
  principal: number | null;
  juros: number | null;
  encargos: number | null;
  saldoDevedorInicial: number | null;
  saldoDevedorFinal: number | null;
  vencimento: string;
  status: 'PENDENTE' | 'PAGA' | 'ATRASADA';
  transacaoId: number | null;
}

export interface AmortizacaoRequest {
  valor: number;
  dataPagamento: string;
  numeroParcelasRestantes: number | null;
  modalidade: 'REDUZIR_PRAZO' | 'REDUZIR_PRESTACAO' | null;
}

export interface Amortizacao {
  financiamento: Financiamento;
  transacaoId: number;
  saldoDevedorAnterior: number;
  saldoDevedorAtual: number;
  parcelasRestantes: number;
}

export interface Refinanciamento {
  financiamentoOrigem: Financiamento;
  novoFinanciamento: Financiamento;
  parcelasExcluidas: number;
}

export interface RefinanciamentoParcelas {
  financiamentoId: number;
  finalizadoEm: string;
  parcelasExcluidas: number;
  mensagem: string;
}

export type ContaElegivel = Conta;

export type CategoriaElegivel = Categoria;

export type MeioElegivel = Meio;

export type ItemElegivel = Item;

export type TipoCompromisso =
  'cartoes' | 'compras' | 'obrigacoes' | 'recorrencias' | 'financiamentos';

export interface CompromissoResponses {
  cartoes: Cartao;
  compras: Compra;
  obrigacoes: Obrigacao;
  recorrencias: Recorrencia;
  financiamentos: Financiamento;
}

export interface CompromissoRequests {
  cartoes: CartaoRequest;
  compras: CompraRequest;
  obrigacoes: ObrigacaoRequest;
  recorrencias: RecorrenciaRequest;
  financiamentos: FinanciamentoRequest;
}

export interface Investimento {
  id: number;
  nome: string;
  tipo: TipoInvestimento;
  contaOrigemId: number;
  contaCustodiaId: number | null;
  ativo: boolean;
}

export type InvestimentoInput = Omit<Investimento, 'id' | 'ativo'>;

export interface MovimentoInvestimento {
  id: number;
  investimentoId: number;
  tipo: TipoMovimentoInvestimento;
  valor: number;
  data: string;
  transacaoId: number | null;
  movimentoOrigemId: number | null;
  estornadoEm: string | null;
}

export type MovimentoInvestimentoInput = Pick<
  MovimentoInvestimento,
  'investimentoId' | 'tipo' | 'valor' | 'data'
>;

export interface PosicaoInvestimento {
  id: number;
  investimentoId: number;
  valor: number;
  dataReferencia: string;
}

export type OpcaoConta = Pick<Conta, 'id' | 'nome' | 'tipo' | 'ativo'>;

export interface Participante {
  usuarioId: number;
  percentual: number | null;
}

export interface DivisaoCompartilhada {
  id: number;
  nome: string;
  criadorId: number;
  status: 'ATIVA' | 'INATIVA';
  participantes: Participante[];
}

export interface Responsabilidade {
  usuarioId: number;
  percentual: number | null;
  valorDevido: number | null;
}

export interface Alocacao {
  id: number;
  transacaoId: number;
  pagadorId: number;
  valor: number;
  criadaEm: string;
  canceladaEm: string | null;
  canceladaPor: number | null;
}

export interface Reembolso {
  id: number;
  transacaoId: number;
  pagadorId: number;
  recebedorId: number;
  valor: number;
  data: string;
  criadoEm: string;
  canceladoEm: string | null;
  canceladoPor: number | null;
}

export interface PagamentoDivisao {
  divisaoId: number;
  transacaoId: number;
  baseCompartilhada: number;
  pago: number;
  pendente: number;
  status: 'PENDENTE' | 'PARCIAL' | 'QUITADO';
  alocacoes: Alocacao[];
}

export interface ResumoDivisao {
  divisaoId: number;
  divisao: string;
  total: number;
  participantes: {
    usuarioId: number;
    percentual: number | null;
    pago: number;
    devido: number;
    saldo: number;
  }[];
  lancamentosPendentesRevisao: number;
}

export interface AssociacaoPendente {
  transacaoId: number;
  pagadorId: number;
  data: string;
  descricao: string;
  valor: number;
}

export interface HistoricoParticipante {
  usuarioId: number;
  percentual: number | null;
  vigenteDesde: string;
  vigenteAte: string | null;
}

export interface LancamentoImportado {
  id: number;
  ordem: number;
  data: string | null;
  descricao: string | null;
  conteudoOriginal: string;
  dataOriginal: string | null;
  descricaoOriginal: string | null;
  valorOriginal: number | null;
  tipoOriginal: TipoTransacao | null;
  valor: number | null;
  tipo: TipoTransacao | null;
  pendenteConfirmacao: boolean;
  motivoPendencia: string | null;
  estado: EstadoLancamentoImportado;
  importar: boolean;
  categoriaId: number | null;
  itemId: number | null;
  transacaoId: number | null;
  obrigacaoFinanceiraId: number | null;
  revisoes: {
    id: number;
    revisadoPor: number;
    decisao: DecisaoRevisaoImportacao;
    motivoIncerteza: string | null;
    justificativa: string;
    anterior: RevisaoEstado;
    novo: RevisaoEstado;
    revisadoEm: string;
  }[];
}

export interface DocumentoImportacao {
  id: number;
  bancoId: number;
  nomeArquivo: string;
  leitor: string;
  tipoDocumento: TipoDocumentoFinanceiro;
  tipoDocumentoPretendido: TipoDocumentoFinanceiro;
  identificadorOrigem: string | null;
  periodoInicio: string | null;
  periodoFim: string | null;
  dataVencimento: string | null;
  saldoInicial: number | null;
  saldoFinal: number | null;
  valorTotal: number | null;
  status: 'PENDENTE_REVISAO' | 'CONFIRMADA';
  contaId: number | null;
  faturaId: number | null;
  lancamentos: LancamentoImportado[];
}

export interface RevisaoImportacao {
  importacao: DocumentoImportacao;
  possiveisDuplicidades: {
    lancamentoImportadoId: number;
    transacaoId: number | null;
    transferenciaId: number | null;
    obrigacaoFinanceiraId: number | null;
    data: string;
    valor: number;
    descricao: string;
    nivel: 'EXATA' | 'PROVAVEL';
    evidencias: string[];
  }[];
  divergencias: { codigo: string; mensagem: string; esperado: string; detectado: string }[];
}

export interface RevisaoImportacaoInput {
  contaId: number | null;
  faturaId: number | null;
  lancamentos: {
    id: number;
    data: string | null;
    descricao: string | null;
    valor: number | null;
    tipo: TipoTransacao | null;
    importar: boolean;
    categoriaId: number | null;
    itemId: number | null;
    transacaoId: number | null;
    obrigacaoFinanceiraId: number | null;
    justificativa: string;
  }[];
}

export type TransacaoItemResponse = Transacao['itens'][number];

export interface TokensSessao {
  accessToken: string;
  refreshToken: string;
  expiraEm: string;
}

export interface CadastroUsuario {
  nome: string;
  email: string;
  senha: string;
}

export interface UsuarioCadastrado {
  id: number;
  nome: string;
  email: string;
}

export type BancoInput = CadastroRequests['bancos'];
export type CategoriaInput = CadastroRequests['categorias'];
export type ItemInput = CadastroRequests['itens'];
export type MeioInput = CadastroRequests['meios-pagamento'];
export type ParticipanteResumo = ResumoDivisao['participantes'][number];
export type DivergenciaImportacao = RevisaoImportacao['divergencias'][number];
export type DuplicidadeImportacao = RevisaoImportacao['possiveisDuplicidades'][number];
export type RevisaoLancamento = LancamentoImportado['revisoes'][number];
export type RevisaoLancamentoInput = RevisaoImportacaoInput['lancamentos'][number];
