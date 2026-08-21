import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { environment } from '../../environment/environment';
import { CategoriasApiService } from './categorias-api.service';

describe('CategoriasApiService', () => {
  let service: CategoriasApiService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CategoriasApiService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('atualiza uma categoria com o pai opcional do contrato', () => {
    service.atualizar(3, { nome: 'Mercado', categoriaPaiId: 1 }).subscribe();
    const request = http.expectOne(`${environment.apiUrl}/categorias/3`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ nome: 'Mercado', categoriaPaiId: 1 });
    request.flush({ id: 3, nome: 'Mercado', categoriaPaiId: 1, ativo: true });
  });
  it('lista categorias usando paginação', () => {
    service.listar({ pagina: 0, tamanho: 100 }).subscribe();
    const request = http.expectOne(
      (requisicao) =>
        requisicao.url === `${environment.apiUrl}/categorias` &&
        requisicao.params.get('tamanho') === '100',
    );
    expect(request.request.method).toBe('GET');
    request.flush({ conteudo: [], pagina: 0, tamanho: 100, totalElementos: 0, totalPaginas: 0 });
  });
});
