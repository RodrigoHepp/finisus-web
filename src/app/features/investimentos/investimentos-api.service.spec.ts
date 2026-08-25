import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { InvestimentosApiService } from './investimentos-api.service';

describe('InvestimentosApiService', () => {
  let service: InvestimentosApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(InvestimentosApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('cria e inativa o investimento com o contrato correto', () => {
    const investimento = { nome: 'CDB', tipo: 'RENDA_FIXA' as const, contaOrigemId: 1 };
    service.criar(investimento).subscribe();
    const criacao = http.expectOne('http://localhost:8080/api/v1/investimentos');
    expect(criacao.request).toMatchObject({ method: 'POST', body: investimento });
    criacao.flush({});

    service.inativar(5).subscribe();
    const inativacao = http.expectOne('http://localhost:8080/api/v1/investimentos/5');
    expect(inativacao.request.method).toBe('DELETE');
    inativacao.flush({});
  });
});
