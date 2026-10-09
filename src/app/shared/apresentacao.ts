import { HttpErrorResponse } from '@angular/common/http';
export function formatarMoeda(valor: number | null | undefined): string {
  return valor == null
    ? 'Não informado'
    : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}
export function formatarDataCivil(valor: string | null | undefined): string {
  if (!valor) return 'Não informado';
  const correspondencia = /^(\d{4})-(\d{2})-(\d{2})/.exec(valor);
  return correspondencia
    ? `${correspondencia[3]}/${correspondencia[2]}/${correspondencia[1]}`
    : valor;
}
export function hoje(): string {
  const agora = new Date();
  return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-${String(agora.getDate()).padStart(2, '0')}`;
}
export function mensagemErro(erro: unknown): string {
  if (!(erro instanceof HttpErrorResponse)) return 'Não foi possível concluir. Tente novamente.';
  if (erro.status === 423)
    return 'Seu usuário está bloqueado. Solicite o desbloqueio a um administrador e entre novamente após o desbloqueio.';
  const corpo: unknown = erro.error;
  const codigo =
    corpo && typeof corpo === 'object' && 'code' in corpo && typeof corpo.code === 'string'
      ? corpo.code
      : null;
  if (codigo === 'error.validacao')
    return 'Confira os campos e os formatos informados. O servidor recusou a validação.';
  if (codigo === 'error.recurso.sem.permissao')
    return 'Este registro não está disponível para o seu usuário.';
  if (codigo === 'error.conflito.atualizacao')
    return 'O registro mudou durante a operação. Seu formulário foi preservado; consulte o estado atual antes de repetir.';
  if (erro.status === 0)
    return 'Não foi possível acessar o servidor. Confira sua conexão e a disponibilidade da API.';
  if (erro.status === 401) return 'Sua sessão expirou. Entre novamente.';
  if (erro.status === 403) return 'Você não tem permissão para esta operação.';
  if (erro.status === 409)
    return 'Os dados mudaram ou esta operação está em conflito. Seu formulário foi preservado; consulte o estado atual antes de repetir.';
  if (
    corpo &&
    typeof corpo === 'object' &&
    'detail' in corpo &&
    typeof corpo.detail === 'string' &&
    !corpo.detail.startsWith('error.')
  )
    return corpo.detail;
  return erro.status === 422
    ? 'A operação não é permitida nas condições atuais. Revise os dados e o estado do registro.'
    : 'Não foi possível concluir a operação. Revise os campos ou tente novamente.';
}
const nomes: Record<string, string> = {
  RECUSADA: 'Recusada',
  RECUSADO: 'Recusado',
  ATIVA: 'Ativa',
  INATIVA: 'Inativa',
  EM_ABERTO: 'Em aberto',
  FINALIZADO: 'Finalizado',
  ATRASADA: 'Atrasada',
  ACEITO: 'Aceito',
  QUITADO: 'Quitado',
  CONFIRMADO: 'Confirmado',
  CONFIRMADA: 'Confirmada',
  PENDENTE_REVISAO: 'Pendente de revisão',
  RENDA_FIXA: 'Renda fixa',
  RENDA_VARIAVEL: 'Renda variável',
  FUNDO: 'Fundo',
  CRIPTO: 'Criptoativos',
  OUTRO: 'Outro',
  FISICO: 'Dinheiro em espécie',
  CORRENTE: 'Conta corrente',
  APLICACAO: 'Aplicação',
  RENDIMENTO_REALIZADO: 'Rendimento realizado',
  MOVIMENTACAO_DIRETA: 'Movimentação direta',
  CARTAO: 'Cartão de crédito',
  PREVISTA: 'Prevista',
  VENCIDO: 'Vencido',
  VENCIDA: 'Vencida',
  PARCELA_FINANCIAMENTO: 'Parcela de financiamento',
  OBRIGACAO_FINANCEIRA: 'Obrigação financeira',
  ENTRADA: 'Receita',
  SAIDA: 'Despesa',
  RECEITA: 'Receita',
  DESPESA: 'Despesa',
  ABERTA: 'Aberta',
  FECHADA: 'Fechada',
  PAGA: 'Paga',
  PAGO: 'Pago',
  CANCELADA: 'Cancelada',
  CANCELADO: 'Cancelado',
  ESTORNADA: 'Estornada',
  ESTORNADO: 'Estornado',
  PENDENTE: 'Pendente',
  PARCIALMENTE_PAGA: 'Parcialmente paga',
  ATIVO: 'Ativo',
  INATIVO: 'Inativo',
  DIRETA: 'Movimentação direta',
  FATURA: 'Compra em fatura',
  PAGAMENTO_FATURA: 'Pagamento de fatura',
  SUPERAVIT: 'Superávit',
  DEFICIT: 'Déficit',
  EQUILIBRADO: 'Equilibrado',
  POSITIVO: 'Positivo',
  NEGATIVO: 'Negativo',
  NEUTRO: 'Neutro',
  SOLICITADA: 'Solicitada',
  EM_ANALISE: 'Em análise',
  CONCLUIDA: 'Concluída',
  ANONIMIZACAO: 'Anonimização',
  OBRIGACAO: 'Obrigação',
  FINANCIAMENTO: 'Financiamento',
  RECORRENCIA: 'Recorrência',
  COMPRA_PARCELADA: 'Compra parcelada',
  CONTA_CORRENTE: 'Conta corrente',
  POUPANCA: 'Poupança',
  DINHEIRO: 'Dinheiro',
  INVESTIMENTO: 'Investimento',
  APORTE: 'Aporte',
  RESGATE: 'Resgate',
  RENDIMENTO: 'Rendimento',
  TAXA: 'Taxa',
  REALIZADA: 'Realizada',
  BAIXO: 'Baixo',
  MEDIO: 'Médio',
  ALTO: 'Alto',
  INFORMACAO: 'Informação',
  ATENCAO: 'Atenção',
  CRITICO: 'Crítico',
  SEM_MOVIMENTO: 'Sem movimento',
  ZERADO: 'Zerado',
  POSITIVA: 'Positiva',
  NEGATIVA: 'Negativa',
  REJEITADA: 'Rejeitada',
  EM_PROCESSAMENTO: 'Em processamento',
  PARCIAL: 'Parcial',
  TOTAL: 'Total',
};
export function status(valor: string | null | undefined): string {
  if (!valor) return 'Não informado';
  return nomes[valor] ?? 'Situação não reconhecida';
}
