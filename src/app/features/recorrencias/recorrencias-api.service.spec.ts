import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { RecorrenciasApiService } from './recorrencias-api.service';

describe('RecorrenciasApiService', () => {
  let service: RecorrenciasApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(RecorrenciasApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('envia a paginação e a inativação para o contrato correto', () => {
    service.listar({ pagina: 2, tamanho: 10 }).subscribe();
    const listagem = http.expectOne(
      'http://localhost:8080/api/v1/recorrencias?pagina=2&tamanho=10',
    );
    expect(listagem.request.method).toBe('GET');
    listagem.flush({});

    service.inativar(7).subscribe();
    const requisicao = http.expectOne('http://localhost:8080/api/v1/recorrencias/7');
    expect(requisicao.request.method).toBe('DELETE');
    requisicao.flush({});
  });
});
