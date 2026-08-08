import { Injectable } from '@angular/core';

import { Sessao } from './auth.models';

const CHAVE_SESSAO = 'finisus.sessao';

@Injectable({ providedIn: 'root' })
export class AuthStorageService {
  obterSessao(): Sessao | null {
    const sessaoEmTexto = sessionStorage.getItem(CHAVE_SESSAO);

    if (!sessaoEmTexto) {
      return null;
    }

    try {
      const sessao = JSON.parse(sessaoEmTexto) as unknown;

      if (!ehSessaoValida(sessao)) {
        this.limparSessao();
        return null;
      }

      return sessao;
    } catch {
      this.limparSessao();
      return null;
    }
  }

  salvarSessao(sessao: Sessao): void {
    sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
  }

  limparSessao(): void {
    sessionStorage.removeItem(CHAVE_SESSAO);
  }
}

function ehSessaoValida(valor: unknown): valor is Sessao {
  if (!ehRegistro(valor) || !ehRegistro(valor['tokens']) || !ehRegistro(valor['usuario'])) {
    return false;
  }

  const tokens = valor['tokens'];
  const usuario = valor['usuario'];

  return (
    ehTextoPreenchido(tokens['accessToken']) &&
    ehTextoPreenchido(tokens['refreshToken']) &&
    ehDataValida(tokens['expiraEm']) &&
    typeof usuario['id'] === 'number' &&
    Number.isSafeInteger(usuario['id']) &&
    usuario['id'] > 0 &&
    ehTextoPreenchido(usuario['nome']) &&
    ehTextoPreenchido(usuario['email']) &&
    typeof usuario['ativo'] === 'boolean'
  );
}

function ehRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null;
}

function ehTextoPreenchido(valor: unknown): valor is string {
  return typeof valor === 'string' && valor.trim().length > 0;
}

function ehDataValida(valor: unknown): valor is string {
  return ehTextoPreenchido(valor) && !Number.isNaN(Date.parse(valor));
}
