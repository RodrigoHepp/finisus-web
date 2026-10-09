import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { URL_BASE_API } from '../api/configuracao-api';
import { sessaoInterceptor } from './sessao.interceptor';
import { SessaoService, TokensSessao } from './sessao.service';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const base = 'https://api.example.test/api/v1';
const tokens: TokensSessao = {
  accessToken: 'access-a',
  refreshToken: 'refresh-a',
  expiraEm: '2099-01-01T00:00:00Z',
};

describe('Contratos e isolamento da sessão', () => {
  let sessao: SessaoService;
  let http: HttpClient;
  let controladorHttp: HttpTestingController;
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([sessaoInterceptor])),
        provideHttpClientTesting(),
        { provide: URL_BASE_API, useValue: base },
      ],
    });
    sessao = TestBed.inject(SessaoService);
    http = TestBed.inject(HttpClient);
    controladorHttp = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    controladorHttp.verify();
    sessionStorage.clear();
  });

  function login(): void {
    sessao.login({ email: 'test@example.test', senha: 'password' }).subscribe();
    const requisicao = controladorHttp.expectOne(`${base}/auth/login`);
    expect(requisicao.request.headers.has('Authorization')).toBe(false);
    requisicao.flush(tokens);
  }

  it('cadastra com Bearer e preserva a sessão do administrador', () => {
    login();
    const cadastro = { nome: 'Pessoa', email: 'test@example.test', senha: 'password' };
    sessao.cadastrar(cadastro).subscribe((usuario) => expect(usuario.id).toBe(1));
    const requisicao = controladorHttp.expectOne(`${base}/auth/cadastro`);
    expect(requisicao.request.body).toEqual(cadastro);
    expect(requisicao.request.headers.get('Authorization')).toBe('Bearer access-a');
    requisicao.flush({ id: 1, nome: cadastro.nome, email: cadastro.email });
    expect(sessao.tokens()).toEqual(tokens);
  });

  function jwt(permissoes: unknown): string {
    return `header.${btoa(JSON.stringify({ permissoes })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')}.signature`;
  }

  it('interpreta apenas permissões conhecidas e acompanha refresh e logout', () => {
    sessao.login({ email: 'test@example.test', senha: 'password' }).subscribe();
    controladorHttp
      .expectOne(`${base}/auth/login`)
      .flush({ ...tokens, accessToken: jwt(['USUARIO_CADASTRAR', 'OUTRA', 'USUARIO_CADASTRAR']) });
    expect(sessao.permissoes()).toEqual(['USUARIO_CADASTRAR']);
    expect(sessao.temPermissao('USUARIO_DESBLOQUEAR')).toBe(false);
    sessao.refresh().subscribe();
    controladorHttp
      .expectOne(`${base}/auth/refresh`)
      .flush({ ...tokens, accessToken: jwt(['USUARIO_DESBLOQUEAR']) });
    expect(sessao.permissoes()).toEqual(['USUARIO_DESBLOQUEAR']);
    sessao.encerrarSessao();
    expect(sessao.permissoes()).toEqual([]);
  });

  it.each([
    'invalid',
    'a.!!!!.c',
    jwt(null),
    jwt('USUARIO_CADASTRAR'),
    jwt([]),
    `a.${btoa('{}')}.c`,
  ])('nega permissões para claim ausente ou inválido: %s', (accessToken) => {
    sessao.login({ email: 'test@example.test', senha: 'password' }).subscribe();
    controladorHttp.expectOne(`${base}/auth/login`).flush({ ...tokens, accessToken });
    expect(sessao.permissoes()).toEqual([]);
  });

  it.each(['GET', 'POST'])('encerra sessão bloqueada em %s sem refresh nem repetição', (metodo) => {
    login();
    http.request(metodo, `${base}/contas`).subscribe({ error: () => undefined });
    controladorHttp.expectOne(`${base}/contas`).flush({}, { status: 423, statusText: 'Locked' });
    controladorHttp.expectNone(`${base}/auth/refresh`);
    controladorHttp.expectNone(`${base}/contas`);
    expect(sessao.autenticado()).toBe(false);
  });

  it('preserva sessão nova após 423 atrasado de token anterior', () => {
    login();
    http.get(`${base}/contas`).subscribe({ error: () => undefined });
    const estadoAnterior = controladorHttp.expectOne(`${base}/contas`);
    sessao.refresh().subscribe();
    controladorHttp.expectOne(`${base}/auth/refresh`).flush({ ...tokens, accessToken: 'access-b' });
    estadoAnterior.flush({}, { status: 423, statusText: 'Locked' });
    expect(sessao.tokens()?.accessToken).toBe('access-b');
  });

  it('não encerra sessão em 403 de cadastro', () => {
    login();
    sessao
      .cadastrar({ nome: 'Pessoa', email: 'test@example.test', senha: 'password' })
      .subscribe({ error: () => undefined });
    controladorHttp
      .expectOne(`${base}/auth/cadastro`)
      .flush({}, { status: 403, statusText: 'Forbidden' });
    expect(sessao.tokens()).toEqual(tokens);
  });

  it.each(['login', 'refresh'])('remove sessão em 423 de %s', (operacao) => {
    login();
    (operacao === 'login'
      ? sessao.login({ email: 'test@example.test', senha: 'password' })
      : sessao.refresh()
    ).subscribe({ error: () => undefined });
    const requisicao = controladorHttp.expectOne(`${base}/auth/${operacao}`);
    expect(requisicao.request.headers.has('Authorization')).toBe(false);
    requisicao.flush({}, { status: 423, statusText: 'Locked' });
    expect(sessao.autenticado()).toBe(false);
  });

  it('envia Bearer somente ao destino configurado da API', () => {
    login();
    http.get(`${base}/contas`).subscribe();
    expect(controladorHttp.expectOne(`${base}/contas`).request.headers.get('Authorization')).toBe(
      'Bearer access-a',
    );
    http.get(`${base}.attacker.test/contas`).subscribe();
    expect(
      controladorHttp
        .expectOne(`${base}.attacker.test/contas`)
        .request.headers.has('Authorization'),
    ).toBe(false);
  });

  it('coordena respostas 401 simultâneas em um único refresh com rotação de token', () => {
    login();
    http.get(`${base}/contas`).subscribe();
    http.get(`${base}/categorias`).subscribe();
    controladorHttp
      .expectOne(`${base}/contas`)
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    controladorHttp
      .expectOne(`${base}/categorias`)
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    const refresh = controladorHttp.expectOne(`${base}/auth/refresh`);
    expect(refresh.request.body).toEqual({ refreshToken: 'refresh-a' });
    expect(refresh.request.headers.has('Authorization')).toBe(false);
    refresh.flush({ ...tokens, accessToken: 'access-b', refreshToken: 'refresh-b' });
    const contas = controladorHttp.expectOne(`${base}/contas`);
    const categorias = controladorHttp.expectOne(`${base}/categorias`);
    expect(contas.request.headers.get('Authorization')).toBe('Bearer access-b');
    contas.flush([]);
    categorias.flush([]);
    expect(sessao.tokens()?.refreshToken).toBe('refresh-b');
  });

  it('não repete mutações desconhecidas após um 401', () => {
    login();
    http.post(`${base}/transacoes`, {}).subscribe({ error: () => undefined });
    controladorHttp
      .expectOne(`${base}/transacoes`)
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    controladorHttp.expectNone(`${base}/auth/refresh`);
    controladorHttp.expectNone(`${base}/transacoes`);
    expect(sessao.autenticado()).toBe(false);
    expect(sessionStorage.getItem('finisus.session')).toBeNull();
  });

  it('não invalida a sessão renovada após um 401 atrasado de uma mutação', () => {
    login();
    http.post(`${base}/transacoes`, {}).subscribe({ error: () => undefined });
    const mutacao = controladorHttp.expectOne(`${base}/transacoes`);
    sessao.refresh().subscribe();
    controladorHttp
      .expectOne(`${base}/auth/refresh`)
      .flush({ ...tokens, accessToken: 'access-b', refreshToken: 'refresh-b' });
    mutacao.flush({}, { status: 401, statusText: 'Unauthorized' });
    controladorHttp.expectNone(`${base}/transacoes`);
    expect(sessao.tokens()?.accessToken).toBe('access-b');
    expect(sessao.autenticado()).toBe(true);
  });

  it('limpa os tokens quando o refresh é recusado', () => {
    login();
    sessao.refresh().subscribe({ error: () => undefined });
    controladorHttp
      .expectOne(`${base}/auth/refresh`)
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(sessao.autenticado()).toBe(false);
    expect(sessionStorage.getItem('finisus.session')).toBeNull();
  });

  it('reutiliza o token renovado após um 401 atrasado de uma requisição anterior', () => {
    login();
    http.get(`${base}/contas`).subscribe();
    http.get(`${base}/categorias`).subscribe();
    const categorias = controladorHttp.expectOne(`${base}/categorias`);
    controladorHttp
      .expectOne(`${base}/contas`)
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    controladorHttp
      .expectOne(`${base}/auth/refresh`)
      .flush({ ...tokens, accessToken: 'access-b', refreshToken: 'refresh-b' });
    controladorHttp.expectOne(`${base}/contas`).flush([]);
    categorias.flush({}, { status: 401, statusText: 'Unauthorized' });
    controladorHttp.expectNone(`${base}/auth/refresh`);
    const requisicaoRepetida = controladorHttp.expectOne(`${base}/categorias`);
    expect(requisicaoRepetida.request.headers.get('Authorization')).toBe('Bearer access-b');
    requisicaoRepetida.flush([]);
  });

  it('encerra a segunda resposta 401 sem entrar em loop', () => {
    login();
    http.get(`${base}/contas`).subscribe({ error: () => undefined });
    controladorHttp
      .expectOne(`${base}/contas`)
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    controladorHttp.expectOne(`${base}/auth/refresh`).flush({ ...tokens, accessToken: 'access-b' });
    controladorHttp
      .expectOne(`${base}/contas`)
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    controladorHttp.expectNone(`${base}/auth/refresh`);
    expect(sessao.autenticado()).toBe(false);
    expect(sessionStorage.getItem('finisus.session')).toBeNull();
  });

  it('preserva a sessão nova quando a consulta repetida recebe um 401 atrasado', () => {
    login();
    http.get(`${base}/contas`).subscribe({ error: () => undefined });
    controladorHttp
      .expectOne(`${base}/contas`)
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    controladorHttp
      .expectOne(`${base}/auth/refresh`)
      .flush({ ...tokens, accessToken: 'access-b', refreshToken: 'refresh-b' });
    const novaTentativa = controladorHttp.expectOne(`${base}/contas`);
    sessao.refresh().subscribe();
    controladorHttp
      .expectOne(`${base}/auth/refresh`)
      .flush({ ...tokens, accessToken: 'access-c', refreshToken: 'refresh-c' });
    novaTentativa.flush({}, { status: 401, statusText: 'Unauthorized' });
    controladorHttp.expectNone(`${base}/contas`);
    expect(sessao.tokens()?.accessToken).toBe('access-c');
    expect(sessao.autenticado()).toBe(true);
  });

  it('não restaura a sessão quando o refresh termina após o logout', () => {
    login();
    sessao.refresh().subscribe({ error: () => undefined });
    sessao.encerrarSessao();
    controladorHttp.expectOne(`${base}/auth/refresh`).flush({ ...tokens, accessToken: 'access-b' });
    expect(sessao.autenticado()).toBe(false);
  });

  it('renova o acesso expirado antes de enviar a mutação uma única vez', () => {
    sessao.login({ email: 'test@example.test', senha: 'password' }).subscribe();
    controladorHttp
      .expectOne(`${base}/auth/login`)
      .flush({ ...tokens, expiraEm: '2000-01-01T00:00:00Z' });
    http.post(`${base}/transacoes`, { valor: 42 }).subscribe();
    controladorHttp.expectNone(`${base}/transacoes`);
    controladorHttp.expectOne(`${base}/auth/refresh`).flush({ ...tokens, accessToken: 'access-b' });
    const requisicao = controladorHttp.expectOne(`${base}/transacoes`);
    expect(requisicao.request.headers.get('Authorization')).toBe('Bearer access-b');
    requisicao.flush({ id: 1 });
  });
});
