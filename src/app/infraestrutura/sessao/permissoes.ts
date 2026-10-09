import type { PermissaoUsuario } from '../api/backend.dtos';

export type Permissao = PermissaoUsuario;

export function ehPermissao(valor: unknown): valor is Permissao {
  return valor === 'USUARIO_CADASTRAR' || valor === 'USUARIO_DESBLOQUEAR';
}

// O claim controla a apresentação; a API continua responsável pela autorização.
export function permissoesDoToken(token: string | undefined): readonly Permissao[] {
  if (!token) return [];
  try {
    const partes = token.split('.');
    if (partes.length !== 3) return [];
    const codificado = partes[1].replace(/-/g, '+').replace(/_/g, '/');
    const bytes = Uint8Array.from(
      atob(codificado.padEnd(Math.ceil(codificado.length / 4) * 4, '=')),
      (c) => c.charCodeAt(0),
    );
    const payload: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (
      !payload ||
      typeof payload !== 'object' ||
      !('permissoes' in payload) ||
      !Array.isArray(payload.permissoes)
    )
      return [];
    return [...new Set(payload.permissoes.filter(ehPermissao))];
  } catch {
    return [];
  }
}
