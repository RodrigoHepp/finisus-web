import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { URL_BASE_API } from '../../infraestrutura/api/configuracao-api';
import {
  CompromissosApi,
  DetalheFatura,
  PagamentoFatura,
  IntencaoPagamento,
} from './compromissos.api';

const base = 'https://api.example.test/api/v1';
describe('Contratos dos comandos de crédito e compromisso', () => {
  let api: CompromissosApi;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: URL_BASE_API, useValue: base },
      ],
    });
    api = TestBed.inject(CompromissosApi);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('preserva paginação e filtros globais de obrigações', () => {
    api
      .listar('obrigacoes', 2, { status: 'VENCIDA', inicio: '2026-10-01', fim: '2026-10-31' })
      .subscribe((pagina) => {
        expect(pagina.totalElementos).toBe(89);
        expect(pagina.conteudo).toEqual([]);
      });
    const requisicao = http.expectOne((r) => r.url === `${base}/obrigacoes-financeiras`);
    expect(requisicao.request.params.get('pagina')).toBe('2');
    expect(requisicao.request.params.get('tamanho')).toBe('20');
    expect(requisicao.request.params.get('status')).toBe('VENCIDA');
    expect(requisicao.request.params.get('inicio')).toBe('2026-10-01');
    requisicao.flush({ conteudo: [], pagina: 2, tamanho: 20, totalElementos: 89, totalPaginas: 5 });
  });
  it('paga parcialmente a fatura pelo agregado com chave e opcionais null', () => {
    const corpo: PagamentoFatura = { valor: 30, dataPagamento: '2026-10-07', contaId: null };
    api.pagarFatura(9, corpo, 'same-intent').subscribe();
    const requisicao = http.expectOne(`${base}/cartoes/faturas/9/pagar`);
    expect(requisicao.request.method).toBe('POST');
    expect(requisicao.request.body).toEqual(corpo);
    expect(requisicao.request.headers.get('Idempotency-Key')).toBe('same-intent');
    http.expectNone(`${base}/transacoes`);
    requisicao.flush({});
  });
  it('retém crédito, zero e saldo aberto vindos da fatura sem recalcular', () => {
    const fixture: DetalheFatura = {
      id: 9,
      cartaoId: 4,
      anoMes: '2026-10',
      fechamento: '2026-10-05',
      vencimento: '2026-10-15',
      status: 'FECHADA',
      contaPagamentoId: 2,
      valorTotal: 50,
      valorPago: 0,
      creditoAplicado: 15,
      valorEmAberto: 35,
      credito: 0,
      transacoes: [],
    };
    api.fatura(9).subscribe((d) => expect(d).toEqual(fixture));
    http.expectOne(`${base}/cartoes/faturas/9`).flush(fixture);
  });
  it('estorna o pagamento específico da obrigação sem criar transação', () => {
    api.estornarPagamentoObrigacao(8, 17).subscribe();
    const requisicao = http.expectOne(`${base}/obrigacoes-financeiras/8/pagamentos/17/estornar`);
    expect(requisicao.request.method).toBe('POST');
    http.expectNone(`${base}/transacoes`);
    requisicao.flush({});
  });
  it('envia juros encargos desconto e pagamento parcial sem somar caixa no cliente', () => {
    const corpo = { dataPagamento: '2026-10-07', valor: 20, juros: 2, encargos: 0, desconto: 1 };
    api.pagarObrigacao(8, corpo).subscribe();
    const requisicao = http.expectOne(`${base}/obrigacoes-financeiras/8/pagar`);
    expect(requisicao.request.body).toEqual(corpo);
    expect(requisicao.request.headers.has('Idempotency-Key')).toBe(false);
    requisicao.flush({});
  });
  it('separa geração de compromisso da realização financeira', () => {
    api.gerar('2026-10').subscribe();
    const geracao = http.expectOne(`${base}/recorrencias/geracoes/2026-10`);
    expect(geracao.request.method).toBe('POST');
    http.expectNone(`${base}/transacoes`);
    geracao.flush([]);
    api.realizar(5).subscribe();
    const realizacao = http.expectOne(`${base}/recorrencias/ocorrencias/5/realizar`);
    expect(realizacao.request.method).toBe('POST');
    realizacao.flush({});
  });
  it('refinancia com o novo contrato aninhado e a parcela inicial', () => {
    const novo = {
      descricao: 'Novo contrato',
      principal: 700,
      taxaJurosMensal: 0,
      numeroParcelas: 7,
      dataInicio: '2026-10-07',
      contaId: 2,
    };
    api.refinanciar(6, 13, novo).subscribe();
    const requisicao = http.expectOne(`${base}/financiamentos/6/refinanciar`);
    expect(requisicao.request.body).toEqual({ parcelaId: 13, novoFinanciamento: novo });
    requisicao.flush({});
  });
  it('corrige erro de parcela com DELETE e consulta cronograma histórico por versão', () => {
    api.removerParcelaIncorreta(6, 13).subscribe();
    const requisicao = http.expectOne(`${base}/financiamentos/6/parcelas/13/erro-de-lancamento`);
    expect(requisicao.request.method).toBe('DELETE');
    requisicao.flush([]);
    api.historicoParcelas(6, 2).subscribe();
    http.expectOne(`${base}/financiamentos/6/cronogramas/2`).flush([]);
  });
  it('preserva nulls da amortização e deixa cálculo do cronograma no servidor', () => {
    const corpo = {
      valor: 100,
      dataPagamento: '2026-10-07',
      numeroParcelasRestantes: null,
      modalidade: null,
    };
    api.amortizar(6, corpo).subscribe();
    const requisicao = http.expectOne(`${base}/financiamentos/6/amortizar`);
    expect(requisicao.request.body).toEqual(corpo);
    requisicao.flush({});
  });
});

describe('Intenção estável de pagamento', () => {
  it('retém chave após falha e separa payload, fatura e nova intenção', () => {
    const intencao = new IntencaoPagamento();
    const corpo = { valor: 20, dataPagamento: '2026-10-07', contaId: null };
    const chave = intencao.obterChave(1, corpo);
    expect(intencao.obterChave(1, { ...corpo })).toBe(chave);
    expect(intencao.obterChave(2, corpo)).not.toBe(chave);
    const alterado = intencao.obterChave(1, { ...corpo, valor: 30 });
    expect(alterado).not.toBe(chave);
    intencao.concluir();
    expect(intencao.obterChave(1, { ...corpo, valor: 30 })).not.toBe(alterado);
  });
});
