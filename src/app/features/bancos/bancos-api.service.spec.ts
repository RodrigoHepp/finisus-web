import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { environment } from '../../environment/environment';
import { BancosApiService } from './bancos-api.service';

describe('BancosApiService', () => {
  let service: BancosApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(BancosApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lista bancos preservando a paginação zero baseada da API', () => {
    service.listar({ pagina: 1, tamanho: 20 }).subscribe();
    const request = http.expectOne(
      (requisicao) =>
        requisicao.url === `${environment.apiUrl}/bancos` &&
        requisicao.params.get('pagina') === '1' &&
        requisicao.params.get('tamanho') === '20',
    );
    expect(request.request.method).toBe('GET');
    request.flush({ conteudo: [], pagina: 1, tamanho: 20, totalElementos: 0, totalPaginas: 0 });
  });

  it('envia o contrato próprio de banco ao criar', () => {
    service.criar({ nome: 'Banco principal', codigo: '001' }).subscribe();
    const request = http.expectOne(`${environment.apiUrl}/bancos`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ nome: 'Banco principal', codigo: '001' });
    request.flush({ id: 1, nome: 'Banco principal', codigo: '001', sistema: false });
  });
});
