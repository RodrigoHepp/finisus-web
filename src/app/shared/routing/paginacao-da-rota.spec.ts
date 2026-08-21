import { convertToParamMap } from '@angular/router';

import { criarParametrosDaPagina, obterPaginaDaRota } from './paginacao-da-rota';

describe('paginacao-da-rota', () => {
  it('converte a página visível da URL para a página zero-based da API', () => {
    expect(obterPaginaDaRota(convertToParamMap({ pagina: '3' }))).toBe(2);
  });

  it.each(['0', '-1', 'abc', '1.5'])('usa a primeira página para o valor inválido %s', (pagina) => {
    expect(obterPaginaDaRota(convertToParamMap({ pagina }))).toBe(0);
  });

  it('omite a primeira página da URL e preserva as páginas seguintes como valores humanos', () => {
    expect(criarParametrosDaPagina(0)).toEqual({ pagina: null });
    expect(criarParametrosDaPagina(2)).toEqual({ pagina: 3 });
  });
});
