import { Injectable } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';

@Injectable()
export class PaginadorPtBrIntl extends MatPaginatorIntl {
  override itemsPerPageLabel = 'Itens por página';
  override nextPageLabel = 'Próxima página';
  override previousPageLabel = 'Página anterior';
  override firstPageLabel = 'Primeira página';
  override lastPageLabel = 'Última página';
  override getRangeLabel = (pagina: number, tamanhoPagina: number, quantidade: number): string => {
    const total = Math.max(quantidade, 0);
    const formatar = new Intl.NumberFormat('pt-BR');
    if (total === 0 || tamanhoPagina === 0) return `0 de ${formatar.format(total)}`;
    const iniciar = pagina * tamanhoPagina;
    const end = Math.min(iniciar + tamanhoPagina, total);
    return `${formatar.format(iniciar + 1)} – ${formatar.format(end)} de ${formatar.format(total)}`;
  };
}

export const PROVIDER_PAGINADOR_PT_BR = {
  provide: MatPaginatorIntl,
  useClass: PaginadorPtBrIntl,
};
