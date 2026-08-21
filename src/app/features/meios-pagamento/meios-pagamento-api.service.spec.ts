import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { environment } from '../../environment/environment';
import { MeiosPagamentoApiService } from './meios-pagamento-api.service';

describe('MeiosPagamentoApiService', () => {
  let service: MeiosPagamentoApiService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MeiosPagamentoApiService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('cria um meio de pagamento com contrato específico', () => {
    service.criar({ nome: 'Pix' }).subscribe();
    const request = http.expectOne(`${environment.apiUrl}/meios-pagamento`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ nome: 'Pix' });
    request.flush({ id: 1, nome: 'Pix', ativo: true });
  });
  it('atualiza um meio de pagamento', () => {
    service.atualizar(2, { nome: 'Cartão' }).subscribe();
    const request = http.expectOne(`${environment.apiUrl}/meios-pagamento/2`);
    expect(request.request.method).toBe('PATCH');
    request.flush({ id: 2, nome: 'Cartão', ativo: true });
  });
});
