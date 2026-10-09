import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { URL_BASE_API } from '../../infraestrutura/api/configuracao-api';
import { DiaADiaApi, ChaveIntencao, TransacaoRequest, TransferenciaRequest } from './dia-a-dia.api';

describe('Contratos das jornadas cotidianas', () => {
  let api: DiaADiaApi;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: URL_BASE_API, useValue: 'https://api.example/api/v1' },
      ],
    });
    api = TestBed.inject(DiaADiaApi);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('preserva paginação real e filtros transacionais no servidor', () => {
    api.transacoes(3, { mes: '2026-10', tipo: 'SAIDA', categoriaId: 7 }).subscribe((pagina) => {
      expect(pagina.totalElementos).toBe(81);
      expect(pagina.pagina).toBe(3);
      expect(pagina.conteudo).toEqual([]);
    });
    const requisicao = http.expectOne(
      (requisicao) => requisicao.url === 'https://api.example/api/v1/transacoes',
    );
    expect(requisicao.request.params.get('pagina')).toBe('3');
    expect(requisicao.request.params.get('tamanho')).toBe('20');
    expect(requisicao.request.params.get('mes')).toBe('2026-10');
    expect(requisicao.request.params.get('tipo')).toBe('SAIDA');
    expect(requisicao.request.params.get('categoriaId')).toBe('7');
    requisicao.flush({ conteudo: [], pagina: 3, tamanho: 20, totalElementos: 81, totalPaginas: 5 });
  });
  it('omite filtros não informados', () => {
    api.transacoes(0, { mes: '', tipo: '', categoriaId: null }).subscribe();
    const requisicao = http.expectOne((r) => r.url.endsWith('/transacoes'));
    expect(requisicao.request.params.keys().sort()).toEqual(['pagina', 'tamanho']);
    requisicao.flush({ conteudo: [], pagina: 0, tamanho: 20, totalElementos: 0, totalPaginas: 0 });
  });
  it('transfere e estorna pelo agregado, com idempotência', () => {
    const corpo: TransferenciaRequest = {
      contaOrigemId: 1,
      contaDestinoId: 2,
      valor: 123.45,
      data: '2026-10-07',
      descricao: 'Reserva',
    };
    api.transferir(corpo, 'intent-1').subscribe();
    const criar = http.expectOne('https://api.example/api/v1/transferencias');
    expect(criar.request.method).toBe('POST');
    expect(criar.request.headers.get('Idempotency-Key')).toBe('intent-1');
    expect(criar.request.body).toEqual(corpo);
    criar.flush({ id: 9, ...corpo, status: 'ATIVA', estornadaEm: null });
    api.estornarTransferencia(9).subscribe();
    const estornar = http.expectOne('https://api.example/api/v1/transferencias/9/estornar');
    expect(estornar.request.method).toBe('POST');
    estornar.flush({ id: 9, ...corpo, status: 'ESTORNADA', estornadaEm: '2026-10-07T15:00:00' });
  });
  it('não modifica valores do ajuste e consulta reconciliação em operação de leitura', () => {
    api
      .ajustar(1, { saldoInformado: 0, motivo: 'Conferência' }, 'adjust-1')
      .subscribe((resultado) => expect(resultado.valorAjuste).toBe(-10));
    const ajuste = http.expectOne('https://api.example/api/v1/contas/1/ajustes-saldo');
    expect(ajuste.request.headers.get('Idempotency-Key')).toBe('adjust-1');
    expect(ajuste.request.body).toEqual({ saldoInformado: 0, motivo: 'Conferência' });
    ajuste.flush({
      id: 2,
      contaId: 1,
      saldoAnterior: 10,
      saldoCalculadoAnterior: 10,
      saldoInformado: 0,
      valorAjuste: -10,
      motivo: 'Conferência',
      dataAjuste: '2026-10-07',
    });
    api.reconciliar(1).subscribe();
    const consulta = http.expectOne('https://api.example/api/v1/contas/1/reconciliacao');
    expect(consulta.request.method).toBe('GET');
    consulta.flush({
      contaId: 1,
      saldoMaterializado: 0,
      saldoCalculado: 0,
      divergencia: 0,
      quantidadeMovimentos: 2,
      quantidadeAjustes: 1,
      conciliado: true,
    });
  });
  it('envia correção com motivo e itens fiéis ao contrato', () => {
    const corpo: TransacaoRequest & { motivo: string } = {
      tipo: 'SAIDA',
      valor: 12.34,
      data: '2026-10-07',
      descricao: 'Compra',
      contaId: 1,
      categoriaId: null,
      meioPagamentoId: null,
      itens: [{ itemId: null, descricao: 'Café', quantidade: 2, valor: 12.34, categoriaId: null }],
      motivo: 'Conferência',
    };
    api.corrigir(4, corpo).subscribe();
    const requisicao = http.expectOne('https://api.example/api/v1/transacoes/4');
    expect(requisicao.request.method).toBe('PATCH');
    expect(requisicao.request.body).toEqual(corpo);
    requisicao.flush({ id: 4, ...corpo, itens: corpo.itens.map((item) => ({ id: 5, ...item })) });
    api.detalhar(4, corpo.itens, corpo.motivo).subscribe();
    const itens = http.expectOne('https://api.example/api/v1/transacoes/4/itens');
    expect(itens.request.method).toBe('PUT');
    expect(itens.request.body).toEqual({ itens: corpo.itens, motivo: corpo.motivo });
    itens.flush({ id: 4, ...corpo });
  });
  it('inativa cadastros por DELETE e usa estorno transacional dedicado', () => {
    api.inativarCadastro('itens', 8).subscribe();
    const remover = http.expectOne('https://api.example/api/v1/itens/8');
    expect(remover.request.method).toBe('DELETE');
    remover.flush(null);
    api.estornar(4).subscribe();
    const estornar = http.expectOne('https://api.example/api/v1/transacoes/4/estorno');
    expect(estornar.request.method).toBe('POST');
    estornar.flush({});
  });
  it('mantém a chave na repetição da mesma intenção e renova após conclusão ou mudança', () => {
    const intencao = new ChaveIntencao();
    const payload = { contaId: 1, valor: 10 };
    const inicial = intencao.obterChave(payload);
    expect(intencao.obterChave({ ...payload })).toBe(inicial);
    expect(intencao.obterChave({ ...payload, valor: 11 })).not.toBe(inicial);
    intencao.concluir();
    expect(intencao.obterChave(payload)).not.toBe(inicial);
  });
});
