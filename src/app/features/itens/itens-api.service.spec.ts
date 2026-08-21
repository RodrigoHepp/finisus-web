import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { environment } from '../../environment/environment';
import { ItensApiService } from './itens-api.service';

describe('ItensApiService', () => {
  let service: ItensApiService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ItensApiService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('cria um item com categoria padrão opcional', () => {
    service.criar({ nome: 'Café', categoriaPadraoId: 4 }).subscribe();
    const request = http.expectOne(`${environment.apiUrl}/itens`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ nome: 'Café', categoriaPadraoId: 4 });
    request.flush({ id: 1, nome: 'Café', categoriaPadraoId: 4, ativo: true });
  });
  it('inativa um item pelo identificador', () => {
    service.inativar(4).subscribe();
    const request = http.expectOne(`${environment.apiUrl}/itens/4`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
  });
});
