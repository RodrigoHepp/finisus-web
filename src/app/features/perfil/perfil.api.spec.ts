import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { URL_BASE_API } from '../../infraestrutura/api/configuracao-api';
import { PerfilApi } from './perfil.api';
describe('Perfil e privacidade', () => {
  let api: PerfilApi;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: URL_BASE_API, useValue: '/api/v1' },
      ],
    });
    api = TestBed.inject(PerfilApi);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('inativação aceita resposta sem corpo', () => {
    let concluir = false;
    api.inativar().subscribe(() => (concluir = true));
    const r = http.expectOne('/api/v1/usuarios/me');
    expect(r.request.method).toBe('DELETE');
    r.flush(null, { status: 204, statusText: 'No Content' });
    expect(concluir).toBe(true);
  });
  it('pedido de anonimização preserva pendência e não afirma exclusão', () => {
    api.solicitarAnonimizacao('Pedido de teste').subscribe((v) => expect(v.concluidaEm).toBeNull());
    const r = http.expectOne('/api/v1/usuarios/me/solicitacoes-anonimizacao');
    expect(r.request.method).toBe('POST');
    expect(r.request.body).toEqual({ motivo: 'Pedido de teste' });
    r.flush({
      id: 1,
      tipo: 'ANONIMIZACAO',
      status: 'SOLICITADA',
      motivo: 'Pedido de teste',
      solicitadaEm: '2026-10-07T10:00:00',
      concluidaEm: null,
      observacao: null,
    });
  });
  it('preferência utiliza contrato aceita e atualização PUT', () => {
    api.atualizarPreferencia(false).subscribe((v) => expect(v.aceita).toBe(false));
    const r = http.expectOne('/api/v1/compartilhamentos/opt-in');
    expect(r.request.method).toBe('PUT');
    expect(r.request.body).toEqual({ aceita: false });
    r.flush({ aceita: false });
  });
});
