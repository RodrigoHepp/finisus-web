export interface LoginRequest {
  email: string;
  senha: string;
}

export interface CadastroRequest {
  nome: string;
  email: string;
  senha: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiraEm: string;
}

export interface UsuarioLogado {
  id: number;
  nome: string;
  email: string;
  ativo: boolean;
}

export interface AtualizarPerfilRequest {
  nome: string;
  email: string;
}

export interface UsuarioCadastrado {
  id: number;
  nome: string;
  email: string;
}

export interface Sessao {
  tokens: AuthTokens;
  usuario: UsuarioLogado;
}
