import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { environment } from '../../environment/environment';
import { CartoesApiService } from './cartoes-api.service';

describe('CartoesApiService', () => {
  let service: CartoesApiService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CartoesApiService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('cria cartão com limite e dias de ciclo', () => {
    const corpo = { nome: 'Visa', limite: 2500, diaFechamento: 10, diaVencimento: 17 };
    service.criar(corpo).subscribe();
    const request = http.expectOne(`${environment.apiUrl}/cartoes`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(corpo);
    request.flush({ id: 1, ...corpo, ativo: true });
  });
  it('lista cartões com a paginação da API', () => {
    service.listar({ pagina: 0, tamanho: 20 }).subscribe();
    const request = http.expectOne(
      (requisicao) =>
        requisicao.url === `${environment.apiUrl}/cartoes` &&
        requisicao.params.get('pagina') === '0',
    );
    expect(request.request.method).toBe('GET');
    request.flush({ conteudo: [], pagina: 0, tamanho: 20, totalElementos: 0, totalPaginas: 0 });
  });
});
