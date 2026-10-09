import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { URL_BASE_API } from '../../infraestrutura/api/configuracao-api';
import { FiltrosRelatorio, RelatoriosApi } from './relatorios.api';
describe('Consultas financeiras', () => {
  let http: HttpTestingController;
  let api: RelatoriosApi;
  const filtros: FiltrosRelatorio = {
    referencia: '2026-10-07',
    inicio: '2026-10-01',
    fim: '2026-10-31',
    anoMes: '2026-10',
    ano: '2026',
    periodoMeses: 3,
    janelaDias: 30,
    tipo: 'SAIDA',
    categoriaId: '8',
    contaId: '3',
  };
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: URL_BASE_API, useValue: '/api/v1' },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    api = TestBed.inject(RelatoriosApi);
  });
  afterEach(() => http.verify());
  it('balancete transmite filtros e mantém total global do servidor', () => {
    api.consultar('balancete', filtros, 2).subscribe((v) => {
      if ('totais' in v) expect(v.totais).toEqual({ resultadoCaixa: 810 });
    });
    const r = http.expectOne((requisicao) => requisicao.url === '/api/v1/dashboard/balancete');
    expect(r.request.params.get('pagina')).toBe('2');
    expect(r.request.params.get('tipo')).toBe('SAIDA');
    expect(r.request.params.get('contaId')).toBe('3');
    r.flush({
      linhas: { conteudo: [], pagina: 2, tamanho: 20, totalElementos: 41, totalPaginas: 3 },
      totais: { resultadoCaixa: 810 },
    });
  });
  it('previsão consulta página e recálculo é comando do servidor', () => {
    api.consultar('previsao', filtros, 1).subscribe();
    const r = http.expectOne((requisicao) => requisicao.url === '/api/v1/previsoes/2026-10');
    expect(r.request.params.get('pagina')).toBe('1');
    r.flush({ conteudo: [], pagina: 1, tamanho: 20, totalElementos: 0, totalPaginas: 0 });
    api.recalcular(6).subscribe();
    const c = http.expectOne((requisicao) => requisicao.url === '/api/v1/previsoes/recalcular');
    expect(c.request.method).toBe('POST');
    expect(c.request.params.get('meses')).toBe('6');
    expect(c.request.body).toBeNull();
    c.flush([]);
  });
});
