import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { environment } from '../../environment/environment';
import { ContasApiService } from './contas-api.service';

describe('ContasApiService', () => {
  let service: ContasApiService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ContasApiService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('cria uma conta com tipo e vínculo de banco explícitos', () => {
    service.criar({ nome: 'Conta principal', tipo: 'CORRENTE', bancoId: 9 }).subscribe();
    const request = http.expectOne(`${environment.apiUrl}/contas`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ nome: 'Conta principal', tipo: 'CORRENTE', bancoId: 9 });
    request.flush({
      id: 1,
      nome: 'Conta principal',
      tipo: 'CORRENTE',
      bancoId: 9,
      saldo: 0,
      ativo: true,
    });
  });
  it('inativa a conta pelo identificador', () => {
    service.inativar(7).subscribe();
    const request = http.expectOne(`${environment.apiUrl}/contas/7`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
  });
});
