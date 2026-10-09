import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { URL_BASE_API } from '../../infraestrutura/api/configuracao-api';
import { DivisoesCompartilhadasPage } from './divisoes-compartilhadas.page';
import { DivisaoCompartilhada } from './divisoes-compartilhadas.api';

const paginaVazia = { conteudo: [], pagina: 0, tamanho: 20, totalElementos: 0, totalPaginas: 0 };
const divisao = (id: number): DivisaoCompartilhada => ({
  id,
  nome: `Divisão ${id}`,
  criadorId: 4,
  status: 'ATIVA',
  participantes: [{ usuarioId: 4, percentual: null }],
});
describe('Concorrência na seleção de divisões compartilhadas', () => {
  let pagina: DivisoesCompartilhadasPage;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: URL_BASE_API, useValue: '/api/v1' },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    pagina = TestBed.createComponent(DivisoesCompartilhadasPage).componentInstance;
    http.expectOne('/api/v1/usuarios/me').flush({ id: 4 });
    http
      .expectOne((requisicao) => requisicao.url === '/api/v1/divisoes-compartilhadas')
      .flush(paginaVazia);
    http.expectOne('/api/v1/compartilhamentos/opt-in').flush({ aceita: true });
  });
  afterEach(() => {
    http.expectNone(
      (requisicao) =>
        /^\/api\/v1\/compartilhamentos(?:\/|$)/.test(requisicao.url) &&
        requisicao.url !== '/api/v1/compartilhamentos/opt-in',
    );
    http.verify();
  });
  it('carrega as divisões atuais sem chamar endpoints legados de compartilhamento', () => {
    expect(pagina.divisoes()?.conteudo).toEqual([]);
  });
  function concluirConsultasDetalhes(id: number): void {
    http
      .expectOne((requisicao) => requisicao.url === `/api/v1/divisoes-compartilhadas/${id}/resumo`)
      .flush({
        divisaoId: id,
        divisao: `Divisão ${id}`,
        total: 50,
        participantes: [],
        lancamentosPendentesRevisao: 0,
      });
    http.expectOne(`/api/v1/divisoes-compartilhadas/${id}/participantes/historico`).flush([]);
    http.expectOne(`/api/v1/divisoes-compartilhadas/${id}/transacoes/pendentes-revisao`).flush([]);
    http.expectOne(`/api/v1/divisoes-compartilhadas/${id}/reembolsos`).flush([]);
  }
  it('protege a navegação após adicionar um participante ainda não salvo', () => {
    expect(pagina.temAlteracoes()).toBe(false);
    pagina.adicionarParticipante();
    expect(pagina.temAlteracoes()).toBe(true);
  });
  it('mantém a divisão mais recente quando as consultas de detalhe chegam fora de ordem', () => {
    pagina.abrirDivisao(1);
    pagina.abrirDivisao(2);
    const estadoMaisAntigo = http.expectOne('/api/v1/divisoes-compartilhadas/1');
    http.expectOne('/api/v1/divisoes-compartilhadas/2').flush(divisao(2));
    concluirConsultasDetalhes(2);
    estadoMaisAntigo.flush(divisao(1));
    expect(pagina.selecionado()?.id).toBe(2);
    expect(pagina.formularioDivisao.controls.nome.value).toBe('Divisão 2');
    expect(pagina.resumo()?.divisaoId).toBe(2);
    http.expectNone((requisicao) =>
      requisicao.url.startsWith('/api/v1/divisoes-compartilhadas/1/'),
    );
  });
  it('mantém o período mais recente quando os resumos chegam fora de ordem', () => {
    pagina.selecionado.set(divisao(1));
    pagina.carregarResumo();
    const estadoMaisAntigo = http.expectOne((r) => r.url.endsWith('/1/resumo'));
    pagina.formularioPeriodo.patchValue({ inicio: '2026-09-01', fim: '2026-09-30' });
    pagina.carregarResumo();
    const estadoMaisRecente = http.expectOne((r) => r.url.endsWith('/1/resumo'));
    estadoMaisRecente.flush({
      divisaoId: 1,
      total: 40,
      participantes: [],
      lancamentosPendentesRevisao: 0,
    });
    estadoMaisAntigo.flush({
      divisaoId: 1,
      total: 99,
      participantes: [],
      lancamentosPendentesRevisao: 0,
    });
    expect(pagina.resumo()?.total).toBe(40);
  });
  it('impede outro membro de consultar pendências exclusivas do criador ou alterar participantes', () => {
    pagina.usuarioAtualId.set(5);
    pagina.abrirDivisao(1);
    http.expectOne('/api/v1/divisoes-compartilhadas/1').flush(divisao(1));
    http
      .expectOne((r) => r.url.endsWith('/1/resumo'))
      .flush({ divisaoId: 1, total: 0, participantes: [], lancamentosPendentesRevisao: 0 });
    http.expectOne('/api/v1/divisoes-compartilhadas/1/participantes/historico').flush([]);
    http.expectOne('/api/v1/divisoes-compartilhadas/1/reembolsos').flush([]);
    http.expectNone((r) => r.url.endsWith('/pendentes-revisao'));
    pagina.atualizarParticipantes();
    pagina.desassociar();
    pagina.salvarAlocacoes();
    http.expectNone((r) => r.method !== 'GET');
    expect(pagina.formularioDivisao.disabled).toBe(true);
  });
  it('não reabre uma divisão antiga após iniciar outra', () => {
    pagina.abrirDivisao(1);
    const estadoMaisAntigo = http.expectOne('/api/v1/divisoes-compartilhadas/1');
    pagina.novaDivisao();
    estadoMaisAntigo.flush(divisao(1));
    expect(pagina.selecionado()).toBeNull();
    expect(pagina.mostrarCriacao()).toBe(true);
    expect(pagina.formularioDivisao.controls.nome.value).toBe('');
  });
});
