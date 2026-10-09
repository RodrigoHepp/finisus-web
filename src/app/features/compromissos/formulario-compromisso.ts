import { FormControl, FormRecord, ValidatorFn, Validators } from '@angular/forms';
import type { TipoCompromisso, CompromissoResponses, DetalheFatura } from './compromissos.api';

export type ValorCampo = string | number | null;
export interface Opcao {
  valor: string | number;
  rotulo: string;
}
export interface Campo {
  chave: string;
  rotulo: string;
  tipo: 'text' | 'number' | 'date' | 'month' | 'select';
  obrigatorio?: boolean;
  minimo?: number;
  maximo?: number;
  comprimentoMaximo?: number;
  opcoes?: Opcao[];
  origem?: 'contas' | 'categorias' | 'meios-pagamento' | 'cartoes';
  orientacao?: string;
}
export type Tarefa =
  | 'criar'
  | 'editar'
  | 'criar-fatura'
  | 'editar-fatura'
  | 'despesa-fatura'
  | 'pagar-fatura'
  | 'ciclos'
  | 'pagar-obrigacao'
  | 'pagar-parcela'
  | 'amortizar'
  | 'refinanciar';
const texto = (chave: string, rotulo: string, comprimentoMaximo = 300): Campo => ({
  chave,
  rotulo,
  tipo: 'text',
  obrigatorio: true,
  comprimentoMaximo,
});
const campoNumero = (
  chave: string,
  rotulo: string,
  minimo = 0.01,
  obrigatorio = true,
  maximo?: number,
): Campo => ({
  chave,
  rotulo,
  tipo: 'number',
  minimo,
  obrigatorio,
  maximo,
});
const dataCivil = (chave: string, rotulo: string): Campo => ({
  chave,
  rotulo,
  tipo: 'date',
  obrigatorio: true,
});
const ref = (
  chave: string,
  rotulo: string,
  origem: Campo['origem'],
  obrigatorio = true,
): Campo => ({
  chave,
  rotulo,
  tipo: 'select',
  origem,
  obrigatorio,
});
const camposFinanciamento: Campo[] = [
  texto('descricao', 'Descrição'),
  campoNumero('principal', 'Principal (R$)'),
  campoNumero('taxaJurosMensal', 'Taxa de juros mensal (%)', 0),
  campoNumero('numeroParcelas', 'Número de parcelas', 1),
  dataCivil('dataInicio', 'Data de início'),
  ref('contaId', 'Conta de pagamento', 'contas'),
];
const camposCriacao: Record<TipoCompromisso, Campo[]> = {
  cartoes: [
    texto('nome', 'Nome do cartão', 100),
    campoNumero('limite', 'Limite (R$)'),
    campoNumero('diaFechamento', 'Dia de fechamento', 1, true, 31),
    campoNumero('diaVencimento', 'Dia de vencimento', 1, true, 31),
  ],
  compras: [
    texto('descricao', 'Descrição'),
    campoNumero('valorTotal', 'Valor total (R$)'),
    campoNumero('numeroParcelas', 'Número de parcelas', 1),
    dataCivil('dataCompra', 'Data da compra'),
    ref('contaId', 'Conta', 'contas'),
    ref('cartaoId', 'Cartão (opcional)', 'cartoes', false),
    ref('categoriaId', 'Categoria (opcional)', 'categorias', false),
  ],
  obrigacoes: [
    texto('descricao', 'Descrição'),
    texto('credor', 'Credor', 150),
    campoNumero('valor', 'Valor (R$)'),
    dataCivil('dataVencimento', 'Vencimento'),
    ref('contaPagamentoId', 'Conta de pagamento', 'contas'),
    ref('categoriaId', 'Categoria (opcional)', 'categorias', false),
  ],
  recorrencias: [
    texto('nome', 'Nome da recorrência', 150),
    {
      chave: 'tipo',
      rotulo: 'Movimentação',
      tipo: 'select',
      obrigatorio: true,
      opcoes: [
        { valor: 'ENTRADA', rotulo: 'Receita' },
        { valor: 'SAIDA', rotulo: 'Despesa' },
      ],
    },
    campoNumero('valorEsperado', 'Valor esperado (R$)'),
    campoNumero('diaDoMes', 'Dia do mês', 1, true, 31),
    ref('contaId', 'Conta', 'contas'),
    ref('categoriaId', 'Categoria (opcional)', 'categorias', false),
    ref('meioPagamentoId', 'Meio de pagamento (opcional)', 'meios-pagamento', false),
  ],
  financiamentos: camposFinanciamento,
};
const mes = () => new Date().toLocaleDateString('sv-SE').slice(0, 7);

/** Define entradas e validações; comandos e efeitos financeiros permanecem na jornada/API. */
function configurarEntidade(
  tarefa: Tarefa,
  tipo: TipoCompromisso,
  entidade: CompromissoResponses[TipoCompromisso] | null,
) {
  const campos = camposCriacao[tipo];
  const valoresIniciais: Record<string, ValorCampo> = {};
  if (tarefa === 'editar') {
    if (entidade)
      for (const f of campos) {
        const valor = Reflect.get(entidade, f.chave) as unknown;
        if (typeof valor === 'number' || typeof valor === 'string' || valor === null)
          valoresIniciais[f.chave] = valor;
      }
  }

  return { campos, valoresIniciais };
}
function configurarFatura(tarefa: Tarefa, fatura: DetalheFatura | null) {
  let valoresIniciais: Record<string, ValorCampo> = {};
  let campos: Campo[] = [
    { chave: 'anoMes', rotulo: 'Mês de referência', tipo: 'month', obrigatorio: true },
    dataCivil('dataFechamento', 'Fechamento'),
    dataCivil('dataVencimento', 'Vencimento'),
    ref('contaPagamentoId', 'Conta de pagamento', 'contas'),
  ];
  if (tarefa === 'criar-fatura') valoresIniciais['anoMes'] = mes();
  else {
    const i = fatura;
    campos = campos.filter((f) => f.chave !== 'anoMes');
    if (i)
      valoresIniciais = {
        dataFechamento: i.fechamento,
        dataVencimento: i.vencimento,
        contaPagamentoId: i.contaPagamentoId,
      };
  }

  return { campos, valoresIniciais };
}
function definirCamposCompromisso(
  tarefa: Tarefa,
  tipo: TipoCompromisso,
  entidade: CompromissoResponses[TipoCompromisso] | null,
  fatura: DetalheFatura | null,
): { campos: Campo[]; valoresIniciais: Record<string, ValorCampo> } {
  let campos: Campo[] = [];
  const valoresIniciais: Record<string, ValorCampo> = {};
  if (tarefa === 'criar' || tarefa === 'editar') return configurarEntidade(tarefa, tipo, entidade);
  if (tarefa === 'criar-fatura' || tarefa === 'editar-fatura')
    return configurarFatura(tarefa, fatura);
  if (tarefa === 'despesa-fatura')
    campos = [
      texto('descricao', 'Descrição do gasto', 500),
      campoNumero('valor', 'Valor (R$)'),
      dataCivil('data', 'Data do gasto'),
      ref('contaId', 'Conta', 'contas'),
      ref('categoriaId', 'Categoria (opcional)', 'categorias', false),
    ];
  if (tarefa === 'pagar-fatura')
    campos = [
      dataCivil('dataPagamento', 'Data do pagamento'),
      {
        ...campoNumero('valor', 'Valor parcial (R$)', 0.01, false),
        orientacao: 'Deixe em branco para o valor definido pelo servidor.',
      },
      ref('contaId', 'Conta (opcional)', 'contas', false),
    ];
  if (tarefa === 'ciclos') campos = [dataCivil('dataReferencia', 'Data para processar os ciclos')];
  if (tarefa === 'pagar-obrigacao')
    campos = [
      dataCivil('dataPagamento', 'Data do pagamento'),
      {
        ...campoNumero('valor', 'Principal pago (R$)', 0.01, false),
        orientacao: 'Deixe em branco para o saldo definido pelo servidor.',
      },
      campoNumero('juros', 'Juros (R$)', 0, false),
      campoNumero('encargos', 'Encargos (R$)', 0, false),
      campoNumero('desconto', 'Desconto (R$)', 0, false),
    ];
  if (tarefa === 'pagar-parcela') campos = [dataCivil('dataPagamento', 'Data do pagamento')];
  if (tarefa === 'amortizar')
    campos = [
      campoNumero('valor', 'Valor de amortização (R$)'),
      dataCivil('dataPagamento', 'Data do pagamento'),
      campoNumero('numeroParcelasRestantes', 'Parcelas restantes (opcional)', 0, false),
      {
        chave: 'modalidade',
        rotulo: 'Modalidade',
        tipo: 'select',
        opcoes: [
          { valor: 'REDUZIR_PRAZO', rotulo: 'Reduzir prazo' },
          { valor: 'REDUZIR_PRESTACAO', rotulo: 'Reduzir prestação' },
        ],
      },
    ];
  if (tarefa === 'refinanciar')
    campos = [campoNumero('parcelaId', 'ID da parcela inicial', 1), ...camposFinanciamento];
  return { campos, valoresIniciais };
}
function validadoresCampo(f: Campo): ValidatorFn[] {
  const validadores: ValidatorFn[] = [];
  if (f.obrigatorio) validadores.push(Validators.required);
  if (f.minimo !== undefined) validadores.push(Validators.min(f.minimo));
  if (f.maximo !== undefined) validadores.push(Validators.max(f.maximo));
  if (f.comprimentoMaximo) validadores.push(Validators.maxLength(f.comprimentoMaximo));
  if (f.obrigatorio && f.tipo === 'text')
    validadores.push((c) =>
      typeof c.value === 'string' && !c.value.trim() ? { blank: true } : null,
    );
  if (
    [
      'numeroParcelas',
      'diaFechamento',
      'diaVencimento',
      'diaDoMes',
      'numeroParcelasRestantes',
      'parcelaId',
    ].includes(f.chave)
  )
    validadores.push((c) =>
      c.value !== null && c.value !== '' && !Number.isInteger(Number(c.value))
        ? { integer: true }
        : null,
    );
  if (f.tipo === 'date') validadores.push(Validators.pattern(/^\d{4}-\d{2}-\d{2}$/));
  if (f.tipo === 'month') validadores.push(Validators.pattern(/^\d{4}-\d{2}$/));

  return validadores;
}
export function configurarFormularioCompromisso(
  formulario: FormRecord<FormControl<ValorCampo>>,
  tarefa: Tarefa,
  tipo: TipoCompromisso,
  entidade: CompromissoResponses[TipoCompromisso] | null,
  fatura: DetalheFatura | null,
): Campo[] {
  const { campos, valoresIniciais } = definirCamposCompromisso(tarefa, tipo, entidade, fatura);
  for (const chave of Object.keys(formulario.controls)) formulario.removeControl(chave);
  for (const f of campos) {
    formulario.addControl(
      f.chave,
      new FormControl<ValorCampo>(valoresIniciais[f.chave] ?? null, validadoresCampo(f)),
    );
  }
  return campos;
}
