import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { environment } from '../../../environment/environment';
import { TransacoesApiService } from './transacoes-api.service';

describe('TransacoesApiService', () => {
  let service: TransacoesApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TransacoesApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  it('lista transações usando a paginação zero baseada da API', () => {
    service.listar({ pagina: 2, tamanho: 20 }).subscribe();

    const requisicao = httpTestingController.expectOne(
      (request) =>
        request.url === `${environment.apiUrl}/transacoes` &&
        request.params.get('pagina') === '2' &&
        request.params.get('tamanho') === '20',
    );

    expect(requisicao.request.method).toBe('GET');
    requisicao.flush({ conteudo: [], pagina: 2, tamanho: 20, totalElementos: 0, totalPaginas: 0 });
  });

  it('cria uma transação com o contrato confirmado no backend', () => {
    const corpo = {
      tipo: 'SAIDA' as const,
      valor: 42.5,
      data: '2026-08-18',
      descricao: 'Mercado',
      contaId: 9,
      categoriaId: 3,
    };
    service.criar(corpo).subscribe();

    const requisicao = httpTestingController.expectOne(`${environment.apiUrl}/transacoes`);

    expect(requisicao.request.method).toBe('POST');
    expect(requisicao.request.body).toEqual(corpo);
    requisicao.flush({ id: 1, ...corpo, meioPagamentoId: null, itens: [] });
  });

  it('estorna a transação sem simular uma exclusão', () => {
    service.estornar(7).subscribe();

    const requisicao = httpTestingController.expectOne(
      `${environment.apiUrl}/transacoes/7/estorno`,
    );

    expect(requisicao.request.method).toBe('POST');
    expect(requisicao.request.body).toEqual({});
    requisicao.flush({});
  });
});
