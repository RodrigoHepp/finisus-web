import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { URL_BASE_API } from '../../infraestrutura/api/configuracao-api';
import { RelatoriosPage } from './relatorios.page';
describe('Filtros de consultas financeiras', () => {
  let pagina: RelatoriosPage;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: URL_BASE_API, useValue: '/api/v1' },
        { provide: ActivatedRoute, useValue: { snapshot: { data: { jornada: 'visao-geral' } } } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    pagina = TestBed.runInInjectionContext(() => new RelatoriosPage());
    http.expectOne((r) => r.url.endsWith('/visao-geral')).flush({});
  });
  afterEach(() => http.verify());
  it('limpa o resultado e cancela a consulta anterior ao escolher filtros inválidos', () => {
    pagina.selecionar('patrimonio');
    http
      .expectOne((r) => r.url.endsWith('/patrimonio'))
      .flush({ patrimonioHistoricoCompleto: false });
    pagina.selecionar('mensal');
    const anterior = http.expectOne((r) => r.url.endsWith('/mensal'));
    pagina.formulario.controls.ano.setValue('x');
    pagina.selecionar('anual');
    expect(anterior.cancelled).toBe(true);
    expect(pagina.dados()).toBeNull();
    expect(pagina.avisoHistorico()).toBe(false);
    expect(pagina.carregando()).toBe(false);
    http.expectNone((r) => r.url.endsWith('/anual'));
  });
  it('mantém o recálculo bloqueado após concluir uma consulta independente', () => {
    pagina.selecionar('previsao');
    http.expectOne((r) => r.url.includes('/previsoes/')).flush({ conteudo: [], totalElementos: 0 });
    pagina.recalcular();
    const comando = http.expectOne((r) => r.url.endsWith('/recalcular'));
    pagina.selecionar('anual');
    http.expectOne((r) => r.url.endsWith('/anual')).flush({ ano: '2026' });
    expect(pagina.recalculando()).toBe(true);
    pagina.recalcular();
    http.expectNone((r) => r.url.endsWith('/recalcular'));
    comando.flush([]);
    expect(pagina.recalculando()).toBe(false);
    expect(pagina.selecionado()).toBe('anual');
    http.expectNone((r) => r.url.endsWith('/anual'));
  });
  it('preserva a identificação dos filtros usados quando o formulário muda', () => {
    pagina.formulario.controls.ano.setValue('2025');
    pagina.selecionar('anual');
    const requisicao = http.expectOne((r) => r.url.endsWith('/anual'));
    pagina.formulario.controls.ano.setValue('2026');
    requisicao.flush({ ano: '2025' });
    expect(pagina.contextoResultado()).toBe('Ano: 2025');
    expect(pagina.rotuloResultado()).toBe('Resultado anual');
  });
  it('permite consultar outro relatório quando um filtro inválido ficou oculto', () => {
    pagina.selecionar('periodo');
    http.expectOne((r) => r.url.endsWith('/resumo')).flush({});
    pagina.formulario.controls.periodoMeses.setValue(0);
    pagina.carregar();
    http.expectNone((r) => r.url.endsWith('/resumo'));
    pagina.selecionar('anual');
    const requisicao = http.expectOne((r) => r.url.endsWith('/anual'));
    expect(requisicao.request.params.get('ano')).toBeTruthy();
    requisicao.flush({ ano: '2026', meses: [], totais: {} });
  });
  it('continua bloqueando os filtros inválidos que pertencem à consulta atual', () => {
    pagina.formulario.controls.janelaDias.setValue(91);
    pagina.carregar();
    http.expectNone((r) => r.url.endsWith('/visao-geral'));
    pagina.selecionar('patrimonio');
    http
      .expectOne((r) => r.url.endsWith('/patrimonio'))
      .flush({ patrimonioHistoricoCompleto: false });
    expect(pagina.avisoHistorico()).toBe(true);
  });
});
