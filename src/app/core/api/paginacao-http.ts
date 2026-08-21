import { HttpParams } from '@angular/common/http';

import { ParametrosPaginacao } from './paginacao.model';

export function criarParametrosPaginacao(parametros: ParametrosPaginacao): HttpParams {
  return new HttpParams().set('pagina', parametros.pagina).set('tamanho', parametros.tamanho);
}
