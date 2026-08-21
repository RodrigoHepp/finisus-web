import { ParamMap, Params } from '@angular/router';

/**
 * Converte a página da URL (humana e iniciada em 1) para o contrato HTTP
 * interno, que é iniciado em 0. URLs inválidas sempre retornam à primeira página.
 */
export function obterPaginaDaRota(parametros: ParamMap): number {
  const valor = parametros.get('pagina');

  if (!valor) {
    return 0;
  }

  const pagina = Number(valor);

  return Number.isSafeInteger(pagina) && pagina > 0 ? pagina - 1 : 0;
}

/** Remove o parâmetro na primeira página para manter URLs canônicas e curtas. */
export function criarParametrosDaPagina(pagina: number): Params {
  return { pagina: pagina > 0 ? pagina + 1 : null };
}
