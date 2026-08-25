import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { FinanciamentosApiService } from './financiamentos-api.service';

describe('FinanciamentosApiService', () => {
  let service: FinanciamentosApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(FinanciamentosApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('cria e cancela o financiamento com o contrato correto', () => {
    const financiamento = {
      descricao: 'Veículo',
      principal: 10000,
      taxaJurosMensal: 1,
      numeroParcelas: 24,
      dataInicio: '2026-08-01',
      contaId: 1,
    };
    service.criar(financiamento).subscribe();
    const criacao = http.expectOne('http://localhost:8080/api/v1/financiamentos');
    expect(criacao.request).toMatchObject({ method: 'POST', body: financiamento });
    criacao.flush({});

    service.cancelar(8).subscribe();
    const cancelamento = http.expectOne('http://localhost:8080/api/v1/financiamentos/8/cancelar');
    expect(cancelamento.request).toMatchObject({ method: 'POST', body: {} });
    cancelamento.flush({});
  });
});
