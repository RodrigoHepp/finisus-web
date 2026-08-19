import { ConfiguracaoCadastro, TipoCadastro } from './cadastros.models';

const TIPOS_DE_CONTA = [
  { valor: 'FISICO', rotulo: 'CADASTROS.TIPOS_CONTA.FISICO' },
  { valor: 'CORRENTE', rotulo: 'CADASTROS.TIPOS_CONTA.CORRENTE' },
  { valor: 'POUPANCA', rotulo: 'CADASTROS.TIPOS_CONTA.POUPANCA' },
  { valor: 'APLICACAO', rotulo: 'CADASTROS.TIPOS_CONTA.APLICACAO' },
] as const;

const CONFIGURACOES: Record<TipoCadastro, ConfiguracaoCadastro> = {
  bancos: {
    tipo: 'bancos',
    endpoint: 'bancos',
    titulo: 'CADASTROS.BANCOS.TITULO',
    descricao: 'CADASTROS.BANCOS.DESCRICAO',
    rotuloSingular: 'CADASTROS.BANCOS.SINGULAR',
    campos: [
      {
        nome: 'nome',
        rotulo: 'COMPARTILHADO.CAMPOS.NOME',
        secao: 'CADASTROS.FORMULARIO.SECOES.IDENTIFICACAO',
        tipo: 'texto',
        obrigatorio: true,
        tamanhoMaximo: 150,
      },
      {
        nome: 'codigo',
        rotulo: 'CADASTROS.CAMPOS.CODIGO',
        secao: 'CADASTROS.FORMULARIO.SECOES.IDENTIFICACAO',
        tipo: 'texto',
        obrigatorio: true,
        tamanhoMaximo: 20,
      },
    ],
  },
  contas: {
    tipo: 'contas',
    endpoint: 'contas',
    titulo: 'CADASTROS.CONTAS.TITULO',
    descricao: 'CADASTROS.CONTAS.DESCRICAO',
    rotuloSingular: 'CADASTROS.CONTAS.SINGULAR',
    campos: [
      {
        nome: 'nome',
        rotulo: 'COMPARTILHADO.CAMPOS.NOME',
        secao: 'CADASTROS.FORMULARIO.SECOES.IDENTIFICACAO',
        tipo: 'texto',
        obrigatorio: true,
        tamanhoMaximo: 150,
      },
      {
        nome: 'tipo',
        rotulo: 'CADASTROS.CAMPOS.TIPO_CONTA',
        secao: 'CADASTROS.FORMULARIO.SECOES.IDENTIFICACAO',
        tipo: 'selecao',
        obrigatorio: true,
        opcoesFixas: TIPOS_DE_CONTA,
      },
      {
        nome: 'bancoId',
        rotulo: 'CADASTROS.CAMPOS.BANCO',
        secao: 'CADASTROS.FORMULARIO.SECOES.VINCULOS',
        tipo: 'selecao',
        obrigatorio: false,
        origemDasOpcoes: 'bancos',
      },
    ],
  },
  categorias: {
    tipo: 'categorias',
    endpoint: 'categorias',
    titulo: 'CADASTROS.CATEGORIAS.TITULO',
    descricao: 'CADASTROS.CATEGORIAS.DESCRICAO',
    rotuloSingular: 'CADASTROS.CATEGORIAS.SINGULAR',
    campos: [
      {
        nome: 'nome',
        rotulo: 'COMPARTILHADO.CAMPOS.NOME',
        secao: 'CADASTROS.FORMULARIO.SECOES.IDENTIFICACAO',
        tipo: 'texto',
        obrigatorio: true,
        tamanhoMaximo: 100,
      },
      {
        nome: 'categoriaPaiId',
        rotulo: 'CADASTROS.CAMPOS.CATEGORIA_PAI',
        secao: 'CADASTROS.FORMULARIO.SECOES.HIERARQUIA',
        tipo: 'selecao',
        obrigatorio: false,
        origemDasOpcoes: 'categorias',
      },
    ],
  },
  itens: {
    tipo: 'itens',
    endpoint: 'itens',
    titulo: 'CADASTROS.ITENS.TITULO',
    descricao: 'CADASTROS.ITENS.DESCRICAO',
    rotuloSingular: 'CADASTROS.ITENS.SINGULAR',
    campos: [
      {
        nome: 'nome',
        rotulo: 'COMPARTILHADO.CAMPOS.NOME',
        secao: 'CADASTROS.FORMULARIO.SECOES.IDENTIFICACAO',
        tipo: 'texto',
        obrigatorio: true,
        tamanhoMaximo: 300,
      },
      {
        nome: 'categoriaPadraoId',
        rotulo: 'CADASTROS.CAMPOS.CATEGORIA_PADRAO',
        secao: 'CADASTROS.FORMULARIO.SECOES.CLASSIFICACAO',
        tipo: 'selecao',
        obrigatorio: false,
        origemDasOpcoes: 'categorias',
      },
    ],
  },
  'meios-pagamento': {
    tipo: 'meios-pagamento',
    endpoint: 'meios-pagamento',
    titulo: 'CADASTROS.MEIOS_PAGAMENTO.TITULO',
    descricao: 'CADASTROS.MEIOS_PAGAMENTO.DESCRICAO',
    rotuloSingular: 'CADASTROS.MEIOS_PAGAMENTO.SINGULAR',
    campos: [
      {
        nome: 'nome',
        rotulo: 'COMPARTILHADO.CAMPOS.NOME',
        secao: 'CADASTROS.FORMULARIO.SECOES.IDENTIFICACAO',
        tipo: 'texto',
        obrigatorio: true,
        tamanhoMaximo: 100,
      },
    ],
  },
};

export function obterConfiguracaoCadastro(valor: string | null): ConfiguracaoCadastro | null {
  if (!valor || !(valor in CONFIGURACOES)) {
    return null;
  }

  return CONFIGURACOES[valor as TipoCadastro];
}
