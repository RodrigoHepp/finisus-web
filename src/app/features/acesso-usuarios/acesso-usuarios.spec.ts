import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { URL_BASE_API } from '../../infraestrutura/api/configuracao-api';
import { SessaoService } from '../../infraestrutura/sessao/sessao.service';
import { AcessoUsuariosPage } from './acesso-usuarios.page';

describe('Administração de usuários', () => {
  let pagina: AcessoUsuariosPage;
  let http: HttpTestingController;
  const permissoes = signal<string[]>([]);
  beforeEach(() => {
    permissoes.set(['USUARIO_CADASTRAR', 'USUARIO_DESBLOQUEAR']);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: URL_BASE_API, useValue: '/api/v1' },
        {
          provide: SessaoService,
          useValue: { temPermissao: (valor: string) => permissoes().includes(valor) },
        },
      ],
    });
    pagina = TestBed.createComponent(AcessoUsuariosPage).componentInstance;
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('não envia cadastro sem permissão, mesmo chamado diretamente', () => {
    permissoes.set([]);
    pagina.cadastro.setValue({
      nome: 'Teste',
      email: 'teste@example.test',
      senha: 'SenhaTeste123',
    });
    pagina.criar();
    http.expectNone('/api/v1/auth/cadastro');
  });
  it('cadastro preserva formulário no 403 e bloqueia envio duplo', () => {
    const valor = { nome: 'Teste', email: 'teste@example.test', senha: 'SenhaTeste123' };
    pagina.cadastro.setValue(valor);
    pagina.cadastro.markAsDirty();
    pagina.criar();
    pagina.criar();
    const requisicao = http.expectOne('/api/v1/auth/cadastro');
    expect(requisicao.request.method).toBe('POST');
    expect(requisicao.request.body).toEqual(valor);
    expect(pagina.cadastro.disabled).toBe(true);
    requisicao.flush({}, { status: 403, statusText: 'Forbidden' });
    expect(pagina.erroCriacao()).toContain('permissão');
    expect(pagina.cadastro.getRawValue()).toEqual(valor);
    expect(pagina.cadastro.enabled).toBe(true);
    expect(pagina.temAlteracoes()).toBe(true);
  });
  it('cadastro limpa a senha e informa ausência de privilégios sem criar sessão', () => {
    pagina.cadastro.setValue({
      nome: 'Teste',
      email: 'teste@example.test',
      senha: 'SenhaTeste123',
    });
    pagina.cadastro.markAsDirty();
    pagina.criar();
    http
      .expectOne('/api/v1/auth/cadastro')
      .flush({ id: 5, nome: 'Teste', email: 'teste@example.test' });
    expect(pagina.cadastro.controls.senha.value).toBe('');
    expect(pagina.temAlteracoes()).toBe(false);
    expect(pagina.sucessoCriacao()).toContain('não recebeu permissões administrativas');
  });
  it('desbloqueio exige confirmação e aceita 204 sem corpo', () => {
    const confirmar = vi.spyOn(window, 'confirm').mockReturnValue(false);
    pagina.desbloqueio.controls.usuarioId.setValue(8);
    pagina.desbloquear();
    http.expectNone('/api/v1/usuarios/8/desbloquear');
    confirmar.mockReturnValue(true);
    pagina.desbloquear();
    const requisicao = http.expectOne('/api/v1/usuarios/8/desbloquear');
    expect(requisicao.request.method).toBe('POST');
    expect(requisicao.request.body).toBeNull();
    requisicao.flush(null, { status: 204, statusText: 'No Content' });
    expect(pagina.sucessoDesbloqueio()).toContain('precisa entrar novamente');
    expect(pagina.desbloqueio.controls.usuarioId.value).toBeNull();
    confirmar.mockRestore();
  });
  it('desbloqueio rejeita IDs fracionários e falta de permissão', () => {
    pagina.desbloqueio.controls.usuarioId.setValue(1.5);
    pagina.desbloquear();
    permissoes.set(['USUARIO_CADASTRAR']);
    pagina.desbloqueio.controls.usuarioId.setValue(2);
    pagina.desbloquear();
    http.expectNone((requisicao) => requisicao.url.includes('/desbloquear'));
  });
});
