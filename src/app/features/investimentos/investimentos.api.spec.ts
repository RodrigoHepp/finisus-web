import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { URL_BASE_API } from '../../infraestrutura/api/configuracao-api';
import { InvestimentosApi } from './investimentos.api';
describe('Contratos de investimentos', () => {
  let api: InvestimentosApi;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: URL_BASE_API, useValue: '/api/v1' },
      ],
    });
    api = TestBed.inject(InvestimentosApi);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('envia custódia separada da origem e preserva custódia nula', () => {
    const input = {
      nome: 'Reserva',
      tipo: 'RENDA_FIXA' as const,
      contaOrigemId: 7,
      contaCustodiaId: null,
    };
    api.salvar(input).subscribe();
    const requisicao = http.expectOne('/api/v1/investimentos');
    expect(requisicao.request.body).toEqual(input);
    requisicao.flush({ id: 3, ...input, ativo: true });
  });
  it('usa o comando do agregado de movimento sem criar transações artificiais', () => {
    api
      .registrarMovimento({
        investimentoId: 3,
        tipo: 'RENDIMENTO_REALIZADO',
        valor: 12.34,
        data: '2026-10-07',
      })
      .subscribe();
    const requisicao = http.expectOne('/api/v1/investimentos/movimentos');
    expect(requisicao.request.body).toEqual({
      investimentoId: 3,
      tipo: 'RENDIMENTO_REALIZADO',
      valor: 12.34,
      data: '2026-10-07',
    });
    requisicao.flush({ id: 1 });
    http.expectNone('/api/v1/transacoes');
  });
  it('registra uma posição observada com valor zero e data civil de referência', () => {
    api.registrarPosicao(3, { valor: 0, dataReferencia: '2026-10-07' }).subscribe();
    const requisicao = http.expectOne('/api/v1/investimentos/3/posicoes');
    expect(requisicao.request.body).toEqual({ valor: 0, dataReferencia: '2026-10-07' });
    requisicao.flush({ id: 1 });
  });
  it('preserva a paginação do servidor e estorna pelo agregado de movimento', () => {
    api.movimentos(3, 2, 10).subscribe((pagina) => expect(pagina.totalElementos).toBe(30));
    const requisicao = http.expectOne(
      (requisicao) => requisicao.url === '/api/v1/investimentos/3/movimentos',
    );
    expect(requisicao.request.params.get('pagina')).toBe('2');
    expect(requisicao.request.params.get('tamanho')).toBe('10');
    requisicao.flush({ conteudo: [], pagina: 2, tamanho: 10, totalElementos: 30, totalPaginas: 3 });
    api.estornar(9).subscribe();
    const estorno = http.expectOne('/api/v1/investimentos/movimentos/9/estornar');
    expect(estorno.request.method).toBe('POST');
    estorno.flush({ id: 10 });
  });
});
