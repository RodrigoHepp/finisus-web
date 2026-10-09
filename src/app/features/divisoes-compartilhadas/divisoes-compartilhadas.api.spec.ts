import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { URL_BASE_API } from '../../infraestrutura/api/configuracao-api';
import { DivisoesCompartilhadasApi } from './divisoes-compartilhadas.api';
describe('Contratos de divisões vinculadas a transações', () => {
  let api: DivisoesCompartilhadasApi;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: URL_BASE_API, useValue: '/api/v1' },
      ],
    });
    api = TestBed.inject(DivisoesCompartilhadasApi);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('associa uma transação real e preserva os snapshots automáticos do servidor', () => {
    const input = { transacaoId: 12, baseCompartilhada: null, responsabilidades: null };
    api.associar(2, input).subscribe();
    const requisicao = http.expectOne('/api/v1/divisoes-compartilhadas/2/transacoes');
    expect(requisicao.request.body).toEqual(input);
    requisicao.flush(null);
  });
  it('envia responsabilidades sem alterar valores ou recalcular a divisão', () => {
    const responsabilidades = [
      { usuarioId: 4, percentual: null, valorDevido: 33.34 },
      { usuarioId: 5, percentual: null, valorDevido: 66.66 },
    ];
    api.responsabilidades(2, 12, responsabilidades).subscribe();
    const requisicao = http.expectOne(
      '/api/v1/divisoes-compartilhadas/2/transacoes/12/responsabilidades',
    );
    expect(requisicao.request.method).toBe('PUT');
    expect(requisicao.request.body).toEqual({ responsabilidades });
    requisicao.flush(null);
  });
  it('substitui alocações usando referências reais às transações de pagamento', () => {
    const alocacoes = [{ transacaoId: 81, valor: 40.12 }];
    api.substituirAlocacoes(2, 12, alocacoes).subscribe();
    const requisicao = http.expectOne('/api/v1/divisoes-compartilhadas/2/transacoes/12/alocacoes');
    expect(requisicao.request.body).toEqual({ alocacoes });
    requisicao.flush([]);
    http.expectNone('/api/v1/transacoes');
  });
  it('registra reembolsos vinculados a uma transação e ao recebedor', () => {
    const input = { transacaoId: 82, recebedorId: 5, valor: 15.01 };
    api.registrarReembolso(2, input).subscribe();
    const requisicao = http.expectOne('/api/v1/divisoes-compartilhadas/2/reembolsos');
    expect(requisicao.request.body).toEqual(input);
    requisicao.flush({ id: 1 });
  });
  it('preserva os totais do servidor e o intervalo de datas civis no resumo', () => {
    api
      .resumo(2, '2026-10-01', '2026-10-07')
      .subscribe((resumo) => expect(resumo.total).toBe(987.65));
    const requisicao = http.expectOne(
      (requisicao) => requisicao.url === '/api/v1/divisoes-compartilhadas/2/resumo',
    );
    expect(requisicao.request.params.get('inicio')).toBe('2026-10-01');
    expect(requisicao.request.params.get('fim')).toBe('2026-10-07');
    requisicao.flush({
      divisaoId: 2,
      divisao: 'Casa',
      total: 987.65,
      participantes: [],
      lancamentosPendentesRevisao: 1,
    });
  });
});
