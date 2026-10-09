import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { URL_BASE_API } from '../../infraestrutura/api/configuracao-api';
import { CompromissosPage } from './compromissos.page';
import { Financiamento, Ocorrencia } from './compromissos.api';

describe('Concorrência das consultas de compromissos', () => {
  let pagina: CompromissosPage;
  let http: HttpTestingController;
  const financiamento: Financiamento = {
    id: 1,
    descricao: 'Financiamento',
    principal: 1000,
    taxaJurosMensal: 1,
    numeroParcelas: 10,
    dataInicio: '2026-10-01',
    contaId: 1,
    status: 'ATIVO',
    cronogramaVersao: 2,
    financiamentoOrigemId: null,
  };
  const ocorrencia: Ocorrencia = {
    id: 1,
    recorrenciaId: 1,
    anoMes: '2026-10',
    vencimento: '2026-10-10',
    tipo: 'SAIDA',
    valor: 100,
    descricao: 'Conta',
    contaId: 1,
    categoriaId: null,
    meioPagamentoId: null,
    status: 'PENDENTE',
    transacaoId: null,
  };
  const vazio = { conteudo: [], pagina: 0, tamanho: 20, totalElementos: 0, totalPaginas: 0 };
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: URL_BASE_API, useValue: '/api/v1' },
        { provide: ActivatedRoute, useValue: { snapshot: { data: { jornada: 'compromissos' } } } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    pagina = TestBed.runInInjectionContext(() => new CompromissosPage());
    for (const requisicao of http.match(() => true)) requisicao.flush(vazio);
  });
  afterEach(() => http.verify());
  it('descarta o mês anterior e suas ações imediatamente ao alterar o filtro', () => {
    pagina.controlMes.setValue('2026-10');
    pagina.carregarOcorrencias();
    const estadoAnterior = http.expectOne('/api/v1/recorrencias/ocorrencias/2026-10');
    pagina.controlMes.setValue('2026-11');
    expect(estadoAnterior.cancelled).toBe(true);
    expect(pagina.ocorrencias()).toBeNull();
    pagina.carregarOcorrencias();
    http
      .expectOne('/api/v1/recorrencias/ocorrencias/2026-11')
      .flush([{ ...ocorrencia, anoMes: '2026-11', id: 2 }]);
    expect(pagina.ocorrencias()?.[0].id).toBe(2);
    pagina.realizar(ocorrencia);
    http.expectNone('/api/v1/recorrencias/ocorrencias/1/realizar');
  });
  it('cancela uma página antiga sem cancelar o cronograma histórico independente', () => {
    pagina.tipo.set('financiamentos');
    pagina.selecionado.set(financiamento);
    pagina.financiamento.set(financiamento);
    pagina.carregarParcelas(0);
    const estadoAnterior = http.expectOne(
      (r) => r.url.endsWith('/parcelas') && r.params.get('pagina') === '0',
    );
    pagina.controlVersao.setValue(1);
    pagina.carregarHistorico();
    const historico = http.expectOne('/api/v1/financiamentos/1/cronogramas/1');
    pagina.carregarParcelas(1);
    expect(estadoAnterior.cancelled).toBe(true);
    expect(historico.cancelled).toBe(false);
    http
      .expectOne((r) => r.url.endsWith('/parcelas') && r.params.get('pagina') === '1')
      .flush({ ...vazio, pagina: 1 });
    expect(pagina.parcelas()?.pagina).toBe(1);
    expect(pagina.carregando()).toBe(true);
    historico.flush([]);
    expect(pagina.carregando()).toBe(false);
  });
  it('invalida o cronograma ao mudar para uma versão inválida', () => {
    pagina.tipo.set('financiamentos');
    pagina.selecionado.set(financiamento);
    pagina.financiamento.set(financiamento);
    pagina.controlVersao.setValue(1);
    pagina.carregarHistorico();
    const estadoAnterior = http.expectOne('/api/v1/financiamentos/1/cronogramas/1');
    pagina.controlVersao.setValue(0);
    pagina.carregarHistorico();
    expect(estadoAnterior.cancelled).toBe(true);
    expect(pagina.historicoParcelas()).toBeNull();
    expect(pagina.carregando()).toBe(false);
  });
});
