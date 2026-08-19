export type TipoConta = 'FISICO' | 'CORRENTE' | 'POUPANCA' | 'APLICACAO';

export type TipoCadastro = 'bancos' | 'contas' | 'categorias' | 'itens' | 'meios-pagamento';

export interface RegistroCadastro {
  readonly id: number;
  readonly nome: string;
  readonly ativo: boolean;
  readonly codigo?: string;
  readonly sistema?: boolean;
  readonly tipo?: TipoConta;
  readonly bancoId?: number | null;
  readonly saldo?: number;
  readonly categoriaPaiId?: number | null;
  readonly categoriaPadraoId?: number | null;
}

export type RequisicaoCadastro =
  | { readonly nome: string; readonly codigo: string }
  | { readonly nome: string; readonly tipo: TipoConta; readonly bancoId?: number }
  | { readonly nome: string; readonly categoriaPaiId?: number }
  | { readonly nome: string; readonly categoriaPadraoId?: number }
  | { readonly nome: string };

export type NomeCampoCadastro =
  'nome' | 'codigo' | 'tipo' | 'bancoId' | 'categoriaPaiId' | 'categoriaPadraoId';

export interface CampoCadastro {
  readonly nome: NomeCampoCadastro;
  readonly rotulo: string;
  readonly secao: string;
  readonly tipo: 'texto' | 'selecao';
  readonly obrigatorio: boolean;
  readonly tamanhoMaximo?: number;
  readonly origemDasOpcoes?: 'bancos' | 'categorias';
  readonly opcoesFixas?: readonly { readonly valor: TipoConta; readonly rotulo: string }[];
}

export interface ConfiguracaoCadastro {
  readonly tipo: TipoCadastro;
  readonly endpoint: string;
  readonly titulo: string;
  readonly descricao: string;
  readonly rotuloSingular: string;
  readonly campos: readonly CampoCadastro[];
}
