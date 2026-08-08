import { TestBed } from '@angular/core/testing';

import { AuthStorageService } from './auth-storage.service';

describe('AuthStorageService', () => {
  let service: AuthStorageService;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthStorageService);
  });

  it('limpa um JSON válido que não representa uma sessão', () => {
    sessionStorage.setItem('finisus.sessao', JSON.stringify({ tokens: {} }));

    expect(service.obterSessao()).toBeNull();
    expect(sessionStorage.getItem('finisus.sessao')).toBeNull();
  });

  it('retorna somente uma sessão que respeita o contrato esperado', () => {
    const sessao = {
      tokens: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiraEm: '2030-01-01T00:00:00.000Z',
      },
      usuario: {
        id: 1,
        nome: 'Ana Silva',
        email: 'ana@example.com',
        ativo: true,
      },
    };
    sessionStorage.setItem('finisus.sessao', JSON.stringify(sessao));

    expect(service.obterSessao()).toEqual(sessao);
  });
});
