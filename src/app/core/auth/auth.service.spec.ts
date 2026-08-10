import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';

import { AuthService } from './auth.service';

const TOKENS = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  expiraEm: '2030-01-01T00:00:00.000Z',
};

const USUARIO = {
  id: 1,
  nome: 'Ana Silva',
  email: 'ana@example.com',
  ativo: true,
};

describe('AuthService', () => {
  let service: AuthService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTranslateService()],
    });

    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('inicia a sessão somente após carregar o usuário autenticado', () => {
    service = TestBed.inject(AuthService);

    service.iniciarSessao(TOKENS).subscribe((usuario) => service.concluirSessao(usuario));

    expect(service.estaAutenticado()).toBe(false);

    const requisicao = httpTestingController.expectOne('http://localhost:8080/api/v1/usuarios/me');
    requisicao.flush(USUARIO);

    expect(service.estaAutenticado()).toBe(true);
    expect(JSON.parse(sessionStorage.getItem('finisus.sessao') ?? '{}')).toEqual({
      tokens: TOKENS,
      usuario: USUARIO,
    });
  });

  it('revalida uma sessão persistida antes de permitir seu uso', () => {
    sessionStorage.setItem('finisus.sessao', JSON.stringify({ tokens: TOKENS, usuario: USUARIO }));
    service = TestBed.inject(AuthService);
    let restaurada: boolean | undefined;

    service.restaurarSessao().subscribe((resultado) => (restaurada = resultado));

    expect(service.estaAutenticado()).toBe(false);

    const requisicao = httpTestingController.expectOne('http://localhost:8080/api/v1/usuarios/me');
    requisicao.flush(USUARIO);

    expect(restaurada).toBe(true);
    expect(service.estaAutenticado()).toBe(true);
  });

  it('limpa uma sessão persistida quando a revalidação falha', () => {
    sessionStorage.setItem('finisus.sessao', JSON.stringify({ tokens: TOKENS, usuario: USUARIO }));
    service = TestBed.inject(AuthService);
    let restaurada: boolean | undefined;

    service.restaurarSessao().subscribe((resultado) => (restaurada = resultado));

    const requisicao = httpTestingController.expectOne('http://localhost:8080/api/v1/usuarios/me');
    requisicao.flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(restaurada).toBe(false);
    expect(service.estaAutenticado()).toBe(false);
    expect(sessionStorage.getItem('finisus.sessao')).toBeNull();
  });
});
