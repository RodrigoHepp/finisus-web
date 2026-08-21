import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Observable } from 'rxjs';

import { AuthApiService } from '../auth/auth-api.service';
import { FaturasApiService } from '../../features/cartoes/faturas-api.service';
import { CompartilhamentosApiService } from '../../features/compartilhamentos/compartilhamentos-api.service';
import { ComprasParceladasApiService } from '../../features/compras-parceladas/compras-parceladas-api.service';
import { FinanciamentosApiService } from '../../features/financiamentos/financiamentos-api.service';
import { InvestimentosApiService } from '../../features/investimentos/investimentos-api.service';
import { PrevisoesApiService } from '../../features/previsoes/previsoes-api.service';
import { RecorrenciasApiService } from '../../features/recorrencias/recorrencias-api.service';
import { environment } from '../../environment/environment';

interface ChamadaHttp {
  readonly descricao: string;
  readonly metodo: string;
  readonly url: string;
  readonly executar: () => Observable<unknown>;
}

describe('clientes dos endpoints financeiros restantes', () => {
  let http: HttpTestingController;
  let auth: AuthApiService;
  let faturas: FaturasApiService;
  let compartilhamentos: CompartilhamentosApiService;
  let compras: ComprasParceladasApiService;
  let financiamentos: FinanciamentosApiService;
  let investimentos: InvestimentosApiService;
  let previsoes: PrevisoesApiService;
  let recorrencias: RecorrenciasApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    http = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthApiService);
    faturas = TestBed.inject(FaturasApiService);
    compartilhamentos = TestBed.inject(CompartilhamentosApiService);
    compras = TestBed.inject(ComprasParceladasApiService);
    financiamentos = TestBed.inject(FinanciamentosApiService);
    investimentos = TestBed.inject(InvestimentosApiService);
    previsoes = TestBed.inject(PrevisoesApiService);
    recorrencias = TestBed.inject(RecorrenciasApiService);
  });

  afterEach(() => http.verify());

  it('mantém os verbos e caminhos definidos pelo backend', () => {
    const api = environment.apiUrl;
    const paginacao = { pagina: 0, tamanho: 20 };
    const chamadas: readonly ChamadaHttp[] = [
      {
        descricao: 'atualizar perfil',
        metodo: 'PATCH',
        url: `${api}/usuarios/me`,
        executar: () => auth.atualizarPerfil({ nome: 'Ana', email: 'ana@finisus.dev' }),
      },
      {
        descricao: 'desativar perfil',
        metodo: 'DELETE',
        url: `${api}/usuarios/me`,
        executar: () => auth.desativarPerfil(),
      },
      {
        descricao: 'listar recorrências',
        metodo: 'GET',
        url: `${api}/recorrencias?pagina=0&tamanho=20`,
        executar: () => recorrencias.listar(paginacao),
      },
      {
        descricao: 'criar recorrência',
        metodo: 'POST',
        url: `${api}/recorrencias`,
        executar: () =>
          recorrencias.criar({
            nome: 'Salário',
            tipo: 'ENTRADA',
            valorEsperado: 1000,
            diaDoMes: 5,
            contaId: 1,
          }),
      },
      {
        descricao: 'consultar recorrência',
        metodo: 'GET',
        url: `${api}/recorrencias/1`,
        executar: () => recorrencias.buscar(1),
      },
      {
        descricao: 'atualizar recorrência',
        metodo: 'PATCH',
        url: `${api}/recorrencias/1`,
        executar: () =>
          recorrencias.atualizar(1, {
            nome: 'Salário',
            tipo: 'ENTRADA',
            valorEsperado: 1000,
            diaDoMes: 5,
            contaId: 1,
          }),
      },
      {
        descricao: 'inativar recorrência',
        metodo: 'DELETE',
        url: `${api}/recorrencias/1`,
        executar: () => recorrencias.inativar(1),
      },
      {
        descricao: 'gerar recorrências',
        metodo: 'POST',
        url: `${api}/recorrencias/geracoes/2026-08`,
        executar: () => recorrencias.gerarMes('2026-08'),
      },
      {
        descricao: 'recalcular previsões',
        metodo: 'POST',
        url: `${api}/previsoes/recalcular?meses=6`,
        executar: () => previsoes.recalcular(6),
      },
      {
        descricao: 'consultar previsões',
        metodo: 'GET',
        url: `${api}/previsoes/2026-08?pagina=0&tamanho=20`,
        executar: () => previsoes.consultar('2026-08', paginacao),
      },
      {
        descricao: 'listar compras',
        metodo: 'GET',
        url: `${api}/compras-parceladas?pagina=0&tamanho=20`,
        executar: () => compras.listar(paginacao),
      },
      {
        descricao: 'criar compra',
        metodo: 'POST',
        url: `${api}/compras-parceladas`,
        executar: () =>
          compras.criar({
            descricao: 'Notebook',
            valorTotal: 3000,
            numeroParcelas: 12,
            dataCompra: '2026-08-01',
            contaId: 1,
          }),
      },
      {
        descricao: 'consultar compra',
        metodo: 'GET',
        url: `${api}/compras-parceladas/1`,
        executar: () => compras.buscar(1),
      },
      {
        descricao: 'cancelar compra',
        metodo: 'POST',
        url: `${api}/compras-parceladas/1/cancelar`,
        executar: () => compras.cancelar(1),
      },
      {
        descricao: 'listar investimentos',
        metodo: 'GET',
        url: `${api}/investimentos?pagina=0&tamanho=20`,
        executar: () => investimentos.listar(paginacao),
      },
      {
        descricao: 'criar investimento',
        metodo: 'POST',
        url: `${api}/investimentos`,
        executar: () => investimentos.criar({ nome: 'CDB', tipo: 'RENDA_FIXA', contaOrigemId: 1 }),
      },
      {
        descricao: 'atualizar investimento',
        metodo: 'PATCH',
        url: `${api}/investimentos/1`,
        executar: () =>
          investimentos.atualizar(1, { nome: 'CDB', tipo: 'RENDA_FIXA', contaOrigemId: 1 }),
      },
      {
        descricao: 'inativar investimento',
        metodo: 'DELETE',
        url: `${api}/investimentos/1`,
        executar: () => investimentos.inativar(1),
      },
      {
        descricao: 'listar movimentos',
        metodo: 'GET',
        url: `${api}/investimentos/1/movimentos?pagina=0&tamanho=20`,
        executar: () => investimentos.listarMovimentos(1, paginacao),
      },
      {
        descricao: 'movimentar investimento',
        metodo: 'POST',
        url: `${api}/investimentos/movimentos`,
        executar: () =>
          investimentos.movimentar({
            investimentoId: 1,
            tipo: 'APORTE',
            valor: 50,
            data: '2026-08-01',
          }),
      },
      {
        descricao: 'estornar movimento',
        metodo: 'POST',
        url: `${api}/investimentos/movimentos/1/estornar`,
        executar: () => investimentos.estornarMovimento(1),
      },
      {
        descricao: 'listar financiamentos',
        metodo: 'GET',
        url: `${api}/financiamentos?pagina=0&tamanho=20`,
        executar: () => financiamentos.listar(paginacao),
      },
      {
        descricao: 'criar financiamento',
        metodo: 'POST',
        url: `${api}/financiamentos`,
        executar: () =>
          financiamentos.criar({
            descricao: 'Veículo',
            principal: 10000,
            taxaJurosMensal: 1,
            numeroParcelas: 24,
            dataInicio: '2026-08-01',
            contaId: 1,
          }),
      },
      {
        descricao: 'cancelar financiamento',
        metodo: 'POST',
        url: `${api}/financiamentos/1/cancelar`,
        executar: () => financiamentos.cancelar(1),
      },
      {
        descricao: 'listar parcelas',
        metodo: 'GET',
        url: `${api}/financiamentos/1/parcelas?pagina=0&tamanho=20`,
        executar: () => financiamentos.listarParcelas(1, paginacao),
      },
      {
        descricao: 'pagar parcela',
        metodo: 'POST',
        url: `${api}/financiamentos/1/parcelas/2/pagar`,
        executar: () => financiamentos.pagarParcela(1, 2, { dataPagamento: '2026-08-01' }),
      },
      {
        descricao: 'refinanciar parcela',
        metodo: 'POST',
        url: `${api}/financiamentos/1/parcelas/2/refinanciamento`,
        executar: () => financiamentos.refinanciarParcela(1, 2),
      },
      {
        descricao: 'corrigir lançamento de parcela',
        metodo: 'DELETE',
        url: `${api}/financiamentos/1/parcelas/2/erro-de-lancamento`,
        executar: () => financiamentos.corrigirErroDeLancamento(1, 2),
      },
      {
        descricao: 'listar faturas',
        metodo: 'GET',
        url: `${api}/cartoes/1/faturas?pagina=0&tamanho=20`,
        executar: () => faturas.listarPorCartao(1, paginacao),
      },
      {
        descricao: 'criar fatura',
        metodo: 'POST',
        url: `${api}/cartoes/faturas`,
        executar: () =>
          faturas.criar({
            cartaoId: 1,
            anoMes: '2026-08',
            dataFechamento: '2026-08-20',
            dataVencimento: '2026-08-30',
            contaPagamentoId: 1,
          }),
      },
      {
        descricao: 'consultar fatura',
        metodo: 'GET',
        url: `${api}/cartoes/faturas/1`,
        executar: () => faturas.buscar(1),
      },
      {
        descricao: 'fechar fatura',
        metodo: 'POST',
        url: `${api}/cartoes/faturas/1/fechar`,
        executar: () => faturas.fechar(1),
      },
      {
        descricao: 'pagar fatura',
        metodo: 'POST',
        url: `${api}/cartoes/faturas/1/pagar`,
        executar: () => faturas.pagar(1, { dataPagamento: '2026-08-30' }),
      },
      {
        descricao: 'atualizar fatura',
        metodo: 'PATCH',
        url: `${api}/cartoes/faturas/1`,
        executar: () =>
          faturas.atualizar(1, {
            dataFechamento: '2026-08-20',
            dataVencimento: '2026-08-30',
            contaPagamentoId: 1,
          }),
      },
      {
        descricao: 'cancelar fatura',
        metodo: 'POST',
        url: `${api}/cartoes/faturas/1/cancelar`,
        executar: () => faturas.cancelar(1),
      },
      {
        descricao: 'consultar opt-in',
        metodo: 'GET',
        url: `${api}/compartilhamentos/opt-in`,
        executar: () => compartilhamentos.consultarOptIn(),
      },
      {
        descricao: 'atualizar opt-in',
        metodo: 'PUT',
        url: `${api}/compartilhamentos/opt-in`,
        executar: () => compartilhamentos.atualizarOptIn(true),
      },
      {
        descricao: 'listar despesas compartilhadas',
        metodo: 'GET',
        url: `${api}/compartilhamentos?pagina=0&tamanho=20`,
        executar: () => compartilhamentos.listarDespesas(paginacao),
      },
      {
        descricao: 'criar despesa compartilhada',
        metodo: 'POST',
        url: `${api}/compartilhamentos`,
        executar: () =>
          compartilhamentos.criarDespesa({
            transacaoId: 1,
            tipoRateio: 'PERCENTUAL',
            participantes: [{ usuarioId: 2, percentual: 50 }],
          }),
      },
      {
        descricao: 'listar rateios',
        metodo: 'GET',
        url: `${api}/compartilhamentos/1/rateios?pagina=0&tamanho=20`,
        executar: () => compartilhamentos.listarRateios(1, paginacao),
      },
      {
        descricao: 'responder rateio',
        metodo: 'POST',
        url: `${api}/compartilhamentos/rateios/1/resposta`,
        executar: () => compartilhamentos.responderRateio(1, true),
      },
      {
        descricao: 'pagar rateio',
        metodo: 'POST',
        url: `${api}/compartilhamentos/rateios/1/pagar`,
        executar: () => compartilhamentos.pagarRateio(1),
      },
      {
        descricao: 'listar rateios recebidos',
        metodo: 'GET',
        url: `${api}/compartilhamentos/rateios/recebidos?pagina=0&tamanho=20`,
        executar: () => compartilhamentos.listarRateiosRecebidos(paginacao),
      },
      {
        descricao: 'listar divisões',
        metodo: 'GET',
        url: `${api}/divisoes-compartilhadas?pagina=0&tamanho=20`,
        executar: () => compartilhamentos.listarDivisoes(paginacao),
      },
      {
        descricao: 'criar divisão',
        metodo: 'POST',
        url: `${api}/divisoes-compartilhadas`,
        executar: () =>
          compartilhamentos.criarDivisao({
            nome: 'Casa',
            participantes: [{ usuarioId: 1, percentual: 100 }],
          }),
      },
      {
        descricao: 'atualizar participantes',
        metodo: 'PATCH',
        url: `${api}/divisoes-compartilhadas/1/participantes`,
        executar: () =>
          compartilhamentos.atualizarParticipantes(1, [{ usuarioId: 1, percentual: 100 }]),
      },
      {
        descricao: 'associar transação',
        metodo: 'POST',
        url: `${api}/divisoes-compartilhadas/1/transacoes`,
        executar: () => compartilhamentos.associarTransacao(1, 2),
      },
      {
        descricao: 'desassociar transação',
        metodo: 'DELETE',
        url: `${api}/divisoes-compartilhadas/1/transacoes/2`,
        executar: () => compartilhamentos.desassociarTransacao(1, 2),
      },
      {
        descricao: 'consultar resumo',
        metodo: 'GET',
        url: `${api}/divisoes-compartilhadas/1/resumo?inicio=2026-08-01&fim=2026-08-31`,
        executar: () => compartilhamentos.consultarResumo(1, '2026-08-01', '2026-08-31'),
      },
    ];

    for (const chamada of chamadas) {
      chamada.executar().subscribe();
      const requisicao = http.expectOne(chamada.url, chamada.descricao);
      expect(requisicao.request.method).toBe(chamada.metodo);
      requisicao.flush({});
    }
  });
});
