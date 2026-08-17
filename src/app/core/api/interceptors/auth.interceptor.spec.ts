import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AuthService } from '../../auth/auth.service';
import { environment } from '../../../environment/environment';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpTestingController: HttpTestingController;
  let criarAuthService: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    criarAuthService = vi.fn(() => ({
      accessToken: () => 'access-token',
    }));

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useFactory: criarAuthService,
        },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  it('adiciona o token Bearer às requisições protegidas, inclusive cadastro de usuário', () => {
    http.post(`${environment.apiUrl}/auth/cadastro`, {}).subscribe();

    const requisicao = httpTestingController.expectOne(`${environment.apiUrl}/auth/cadastro`);

    expect(requisicao.request.headers.get('Authorization')).toBe('Bearer access-token');
    requisicao.flush({});
  });

  it('não adiciona o token Bearer aos endpoints públicos de autenticação', () => {
    http.post(`${environment.apiUrl}/auth/login`, {}).subscribe();

    const requisicao = httpTestingController.expectOne(`${environment.apiUrl}/auth/login`);

    expect(requisicao.request.headers.has('Authorization')).toBe(false);
    requisicao.flush({});
  });

  it('não cria serviços de autenticação para arquivos públicos de tradução', () => {
    http.get('/i18n/pt-BR.json').subscribe();

    const requisicao = httpTestingController.expectOne('/i18n/pt-BR.json');

    expect(criarAuthService).not.toHaveBeenCalled();
    requisicao.flush({});
  });
});
