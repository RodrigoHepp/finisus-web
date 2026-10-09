import { describe, expect, it } from 'vitest';
import { PaginadorPtBrIntl } from './paginador-pt-br';

describe('Paginação em português brasileiro', () => {
  const paginador = new PaginadorPtBrIntl();
  it('orienta tamanho e navegação em português', () => {
    expect(paginador.itemsPerPageLabel).toBe('Itens por página');
    expect(paginador.nextPageLabel).toBe('Próxima página');
    expect(paginador.previousPageLabel).toBe('Página anterior');
    expect(paginador.firstPageLabel).toBe('Primeira página');
    expect(paginador.lastPageLabel).toBe('Última página');
  });
  it('apresenta total vazio, última página parcial e milhares sem somar a página', () => {
    expect(paginador.getRangeLabel(0, 10, 0)).toBe('0 de 0');
    expect(paginador.getRangeLabel(2, 10, 23)).toBe('21 – 23 de 23');
    expect(paginador.getRangeLabel(0, 10, 1234)).toBe('1 – 10 de 1.234');
    expect(paginador.getRangeLabel(0, 0, 23)).toBe('0 de 23');
  });
});
