import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ComprasParceladasApiService } from './compras-parceladas-api.service';

describe('ComprasParceladasApiService', () => {
  let service: ComprasParceladasApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ComprasParceladasApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('cria e cancela a compra com o contrato correto', () => {
    const compra = {
      descricao: 'Notebook',
      valorTotal: 3000,
      numeroParcelas: 12,
      dataCompra: '2026-08-01',
      contaId: 1,
    };
    service.criar(compra).subscribe();
    const criacao = http.expectOne('http://localhost:8080/api/v1/compras-parceladas');
    expect(criacao.request).toMatchObject({ method: 'POST', body: compra });
    criacao.flush({});

    service.cancelar(4).subscribe();
    const cancelamento = http.expectOne(
      'http://localhost:8080/api/v1/compras-parceladas/4/cancelar',
    );
    expect(cancelamento.request).toMatchObject({ method: 'POST', body: {} });
    cancelamento.flush({});
  });
});
