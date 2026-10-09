import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { URL_BASE_API } from '../../infraestrutura/api/configuracao-api';
import { PerfilPage } from './perfil.page';
describe('Edição do perfil durante salvamento', () => {
  let pagina: PerfilPage;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: URL_BASE_API, useValue: '/api/v1' },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    pagina = TestBed.runInInjectionContext(() => new PerfilPage());
    http
      .expectOne('/api/v1/usuarios/me')
      .flush({ id: 1, nome: 'Pessoa de teste', email: 'teste@example.test', ativo: true });
    http.expectOne('/api/v1/compartilhamentos/opt-in').flush({ aceita: true });
    http.expectOne('/api/v1/usuarios/me/solicitacoes-privacidade').flush([]);
  });
  afterEach(() => http.verify());
  it('não marca como salvas as alterações feitas após o envio', () => {
    pagina.formulario.controls.nome.setValue('Primeira edição');
    pagina.formulario.markAsDirty();
    pagina.salvar();
    const requisicao = http.expectOne('/api/v1/usuarios/me');
    pagina.formulario.controls.nome.setValue('Segunda edição');
    requisicao.flush({ id: 1, nome: 'Primeira edição', email: 'teste@example.test', ativo: true });
    expect(pagina.formulario.controls.nome.value).toBe('Segunda edição');
    expect(pagina.formulario.dirty).toBe(true);
    expect(pagina.sucesso()).toContain('não salvas');
  });
  it('exibe a resposta normalizada quando o formulário não foi alterado durante o envio', () => {
    pagina.formulario.controls.email.setValue('TESTE@example.test');
    pagina.formulario.markAsDirty();
    pagina.salvar();
    http
      .expectOne('/api/v1/usuarios/me')
      .flush({ id: 1, nome: 'Pessoa de teste', email: 'teste@example.test', ativo: true });
    expect(pagina.formulario.controls.email.value).toBe('teste@example.test');
    expect(pagina.formulario.pristine).toBe(true);
  });
});
