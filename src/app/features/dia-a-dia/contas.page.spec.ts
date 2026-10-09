import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { MatDialog } from '@angular/material/dialog';
import { URL_BASE_API } from '../../infraestrutura/api/configuracao-api';
import { ContasPage } from './contas.page';
describe('Vínculo de banco por tipo de conta', () => {
  let pagina: ContasPage;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: URL_BASE_API, useValue: '/api/v1' },
        { provide: MatDialog, useValue: {} },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    pagina = TestBed.runInInjectionContext(() => new ContasPage());
    http
      .expectOne((r) => r.url === '/api/v1/contas')
      .flush({ conteudo: [], pagina: 0, tamanho: 20, totalElementos: 0, totalPaginas: 0 });
    pagina.formulario.controls.nome.setValue('Conta fictícia');
  });
  afterEach(() => http.verify());
  it('exige banco para conta corrente, poupança e aplicação', () => {
    for (const tipo of ['CORRENTE', 'POUPANCA', 'APLICACAO'] as const) {
      pagina.formulario.controls.tipo.setValue(tipo);
      pagina.formulario.controls.bancoId.setValue(null);
      expect(pagina.formulario.invalid).toBe(true);
      pagina.formulario.controls.bancoId.setValue(1);
      expect(pagina.formulario.valid).toBe(true);
    }
  });
  it('retira o vínculo ao escolher dinheiro em espécie', () => {
    pagina.formulario.controls.bancoId.setValue(1);
    pagina.formulario.controls.tipo.setValue('FISICO');
    expect(pagina.formulario.controls.bancoId.value).toBeNull();
    expect(pagina.formulario.valid).toBe(true);
  });
});
