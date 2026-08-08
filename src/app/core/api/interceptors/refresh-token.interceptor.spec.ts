import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { vi } from 'vitest';

import { AuthService } from '../../auth/auth.service';
import { environment } from '../../../environment/environment';
import { MensagemGlobalService } from '../../../shared/ui/mensagem-global/mensagem-global.service';
import { refreshTokenInterceptor } from './refresh-token.interceptor';

const NOVOS_TOKENS = {
  accessToken: 'novo-access-token',
  refreshToken: 'novo-refresh-token',
  expiraEm: '2030-01-01T00:00:00.000Z',
};

describe('refreshTokenInterceptor', () => {
  let http: HttpClient;
  let httpTestingController: HttpTestingController;
  let authService: {
    atualizarTokens: ReturnType<typeof vi.fn>;
    encerrarSessao: ReturnType<typeof vi.fn>;
  };
  let router: { navigate: ReturnType<typeof vi.fn>; url: string };
  let mensagemGlobalService: { aviso: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authService = {
      atualizarTokens: vi.fn(),
      encerrarSessao: vi.fn(),
    };
    router = {
      navigate: vi.fn(() => Promise.resolve(true)),
      url: '/dashboard',
    };
    mensagemGlobalService = { aviso: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([refreshTokenInterceptor])),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useValue: {
            accessToken: () => 'access-token-expirado',
            refreshToken: () => 'refresh-token',
            ...authService,
          },
        },
        {
          provide: Router,
          useValue: router,
        },
        {
          provide: MensagemGlobalService,
          useValue: mensagemGlobalService,
        },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  it('renova o token uma vez e repete todas as requisições que receberam 401', () => {
    let respostasConcluidas = 0;

    http.get(`${environment.apiUrl}/contas`).subscribe(() => (respostasConcluidas += 1));
    http.get(`${environment.apiUrl}/categorias`).subscribe(() => (respostasConcluidas += 1));

    const requisicoesIniciais = httpTestingController.match((requisicao) =>
      ['/contas', '/categorias'].some(
        (caminho) => requisicao.url === `${environment.apiUrl}${caminho}`,
      ),
    );
    requisicoesIniciais[0].flush(null, { status: 401, statusText: 'Unauthorized' });
    requisicoesIniciais[1].flush(null, { status: 401, statusText: 'Unauthorized' });

    const renovacao = httpTestingController.expectOne(`${environment.apiUrl}/auth/refresh`);
    expect(renovacao.request.body).toEqual({ refreshToken: 'refresh-token' });
    renovacao.flush(NOVOS_TOKENS);

    const requisicoesRepetidas = httpTestingController.match(
      (requisicao) => requisicao.headers.get('Authorization') === 'Bearer novo-access-token',
    );
    expect(requisicoesRepetidas).toHaveLength(2);
    requisicoesRepetidas.forEach((requisicao) => requisicao.flush({}));

    expect(authService.atualizarTokens).toHaveBeenCalledOnce();
    expect(respostasConcluidas).toBe(2);
  });

  it('encerra a sessão, avisa e redireciona ao login quando a renovação falha', () => {
    http.get(`${environment.apiUrl}/contas`).subscribe({ error: () => undefined });

    httpTestingController
      .expectOne(`${environment.apiUrl}/contas`)
      .flush(null, { status: 401, statusText: 'Unauthorized' });
    httpTestingController
      .expectOne(`${environment.apiUrl}/auth/refresh`)
      .flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(authService.encerrarSessao).toHaveBeenCalledOnce();
    expect(mensagemGlobalService.aviso).toHaveBeenCalledWith(
      'Sua sessão expirou. Entre novamente.',
    );
    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { retorno: '/dashboard' },
    });
  });
});
