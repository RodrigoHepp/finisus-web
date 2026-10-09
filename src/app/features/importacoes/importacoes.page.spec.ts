import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { URL_BASE_API } from '../../infraestrutura/api/configuracao-api';
import { ImportacoesPage } from './importacoes.page';
import { RevisaoImportacao, LancamentoImportado } from './importacoes.api';
const linha: LancamentoImportado = {
  id: 21,
  ordem: 1,
  data: '2026-10-07',
  descricao: 'Mercado',
  conteudoOriginal: '07/10 Mercado 40,12',
  dataOriginal: '2026-10-07',
  descricaoOriginal: 'Mercado',
  valorOriginal: 40.12,
  tipoOriginal: 'SAIDA',
  valor: 40.12,
  tipo: 'SAIDA',
  pendenteConfirmacao: true,
  motivoPendencia: 'Revisar',
  estado: 'PENDENTE',
  importar: true,
  categoriaId: null,
  itemId: null,
  transacaoId: null,
  obrigacaoFinanceiraId: null,
  revisoes: [],
};
const revisao: RevisaoImportacao = {
  importacao: {
    id: 5,
    bancoId: 2,
    nomeArquivo: 'extrato.pdf',
    leitor: 'leitor',
    tipoDocumento: 'EXTRATO_CONTA',
    tipoDocumentoPretendido: 'EXTRATO_CONTA',
    identificadorOrigem: null,
    periodoInicio: '2026-10-01',
    periodoFim: '2026-10-07',
    dataVencimento: null,
    saldoInicial: 0,
    saldoFinal: 0,
    valorTotal: null,
    status: 'PENDENTE_REVISAO',
    contaId: 7,
    faturaId: null,
    lancamentos: [linha],
  },
  possiveisDuplicidades: [],
  divergencias: [],
};
describe('Revisão humana de importações', () => {
  let pagina: ImportacoesPage;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: URL_BASE_API, useValue: '/api/v1' },
        { provide: MatDialog, useValue: { abrir: () => ({ afterClosed: () => of(true) }) } },
      ],
    });
    vi.spyOn(MatDialog.prototype, 'open').mockReturnValue({
      afterClosed: () => of(true),
    } as MatDialogRef<unknown>);
    http = TestBed.inject(HttpTestingController);
    pagina = TestBed.createComponent(ImportacoesPage).componentInstance;
  });
  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });
  function retomar(valor = revisao): void {
    pagina.formularioRetomada.controls.id.setValue(5);
    pagina.retomar();
    http.expectOne('/api/v1/importacoes-financeiras/5').flush(valor);
  }
  it('não substitui o documento retomado mais recente por uma resposta antiga', () => {
    pagina.formularioRetomada.controls.id.setValue(5);
    pagina.retomar();
    const estadoMaisAntigo = http.expectOne('/api/v1/importacoes-financeiras/5');
    pagina.formularioRetomada.controls.id.setValue(6);
    pagina.retomar();
    const estadoMaisRecente = http.expectOne('/api/v1/importacoes-financeiras/6');
    estadoMaisRecente.flush({ ...revisao, importacao: { ...revisao.importacao, id: 6 } });
    estadoMaisAntigo.flush(revisao);
    expect(pagina.documento()?.id).toBe(6);
  });
  it('não restaura o documento retomado após iniciar outro envio', () => {
    pagina.formularioRetomada.controls.id.setValue(5);
    pagina.retomar();
    const requisicao = http.expectOne('/api/v1/importacoes-financeiras/5');
    pagina.reiniciar();
    requisicao.flush(revisao);
    expect(pagina.documento()).toBeNull();
    expect(pagina.linhas.controls).toHaveLength(0);
  });
  it('exige decisão explícita e justificativa para cada lançamento extraído', () => {
    retomar();
    pagina.salvarRevisao();
    http.expectNone('/api/v1/importacoes-financeiras/5/revisao');
    expect(pagina.erro()).toContain('justificativa');
    expect(pagina.revisado()).toBe(false);
  });
  it('envia o arquivo e os parâmetros de destino sem definir cabeçalhos multipart manualmente', () => {
    const arquivo = new File(['%PDF-test'], 'extrato.pdf', { type: 'application/pdf' });
    pagina.arquivo.set(arquivo);
    pagina.formularioEnvio.setValue({ bancoId: 2, tipoDocumento: 'EXTRATO_CONTA', destinoId: 7 });
    pagina.enviarArquivo();
    const requisicao = http.expectOne(
      (requisicao) => requisicao.url === '/api/v1/importacoes-financeiras',
    );
    expect(requisicao.request.params.get('bancoId')).toBe('2');
    expect(requisicao.request.params.get('contaId')).toBe('7');
    expect(requisicao.request.params.has('faturaId')).toBe(false);
    expect(requisicao.request.body.get('arquivo').name).toBe('extrato.pdf');
    expect(requisicao.request.headers.has('Content-Type')).toBe(false);
    requisicao.flush(revisao);
    expect(pagina.documento()?.id).toBe(5);
  });
  it('associa uma transação existente e preserva a extração original', () => {
    retomar();
    pagina.linhas.at(0).patchValue({
      decisao: 'ASSOCIAR_TRANSACAO',
      existenteId: 99,
      justificativa: 'Já registrada no mesmo destino.',
    });
    pagina.salvarRevisao();
    const requisicao = http.expectOne('/api/v1/importacoes-financeiras/5/revisao');
    expect(requisicao.request.body.lancamentos[0]).toEqual({
      id: 21,
      data: '2026-10-07',
      descricao: 'Mercado',
      valor: 40.12,
      tipo: 'SAIDA',
      importar: true,
      categoriaId: null,
      itemId: null,
      transacaoId: 99,
      obrigacaoFinanceiraId: null,
      justificativa: 'Já registrada no mesmo destino.',
    });
    requisicao.flush(revisao);
    expect(pagina.documento()?.lancamentos[0]?.valorOriginal).toBe(40.12);
    expect(pagina.revisado()).toBe(true);
  });
  it('descarta um lançamento com justificativa sem selecionar duplicidades automaticamente', () => {
    retomar({
      ...revisao,
      possiveisDuplicidades: [
        {
          lancamentoImportadoId: 21,
          transacaoId: 99,
          transferenciaId: null,
          obrigacaoFinanceiraId: null,
          data: '2026-10-07',
          valor: 40.12,
          descricao: 'Mercado',
          nivel: 'EXATA',
          evidencias: ['Mesmo valor'],
        },
      ],
    });
    expect(pagina.linhas.at(0).controls.decisao.value).toBe('');
    pagina.linhas.at(0).patchValue({ decisao: 'IGNORAR', justificativa: 'Duplicidade conferida.' });
    pagina.salvarRevisao();
    const requisicao = http.expectOne('/api/v1/importacoes-financeiras/5/revisao');
    expect(requisicao.request.body.lancamentos[0].importar).toBe(false);
    expect(requisicao.request.body.lancamentos[0].transacaoId).toBeNull();
    requisicao.flush(revisao);
  });
  it('bloqueia a confirmação até salvar a revisão e a invalida após nova edição', () => {
    retomar();
    pagina.confirmarImportacao();
    http.expectNone('/api/v1/importacoes-financeiras/5/confirmar');
    pagina.linhas.at(0).patchValue({ decisao: 'CRIAR', justificativa: 'Valores conferidos.' });
    pagina.salvarRevisao();
    http.expectOne('/api/v1/importacoes-financeiras/5/revisao').flush(revisao);
    pagina.linhas.at(0).controls.descricao.setValue('Descrição alterada');
    expect(pagina.revisado()).toBe(false);
    pagina.confirmarImportacao();
    http.expectNone('/api/v1/importacoes-financeiras/5/confirmar');
  });
  it('confirma pelo agregado de importação sem criar uma transação artificial', () => {
    retomar();
    pagina.linhas.at(0).patchValue({ decisao: 'CRIAR', justificativa: 'Conferido.' });
    pagina.salvarRevisao();
    http.expectOne('/api/v1/importacoes-financeiras/5/revisao').flush(revisao);
    pagina.confirmarImportacao();
    const requisicao = http.expectOne('/api/v1/importacoes-financeiras/5/confirmar');
    expect(requisicao.request.method).toBe('POST');
    requisicao.flush({ ...revisao.importacao, status: 'CONFIRMADA' });
    expect(pagina.documento()?.status).toBe('CONFIRMADA');
    http.expectNone('/api/v1/transacoes');
  });
  it('preserva as edições e não informa sucesso quando a revisão falha', () => {
    retomar();
    pagina.linhas.at(0).patchValue({ decisao: 'CRIAR', justificativa: 'Conferido.' });
    pagina.salvarRevisao();
    http
      .expectOne('/api/v1/importacoes-financeiras/5/revisao')
      .flush(
        { detail: 'Destino incompatível' },
        { status: 422, statusText: 'Unprocessable Entity' },
      );
    expect(pagina.linhas.at(0).controls.justificativa.value).toBe('Conferido.');
    expect(pagina.revisado()).toBe(false);
    expect(pagina.erro()).toContain('Destino incompatível');
  });
  it('não aprova alterações feitas enquanto uma revisão anterior está em andamento', () => {
    retomar();
    pagina.linhas
      .at(0)
      .patchValue({ decisao: 'CRIAR', descricao: 'Revisão A', justificativa: 'Conferido A.' });
    pagina.salvarRevisao();
    const pendencias = http.expectOne('/api/v1/importacoes-financeiras/5/revisao');
    pagina.linhas.at(0).controls.descricao.setValue('Revisão B');
    pagina.linhas.at(0).markAsDirty();
    pagina.formularioDestino.controls.destinoId.setValue(8);
    pagina.formularioDestino.markAsDirty();
    pendencias.flush({
      ...revisao,
      importacao: { ...revisao.importacao, lancamentos: [{ ...linha, descricao: 'Revisão A' }] },
    });
    expect(pagina.linhas.at(0).controls.descricao.value).toBe('Revisão B');
    expect(pagina.formularioDestino.controls.destinoId.value).toBe(8);
    expect(pagina.linhas.dirty).toBe(true);
    expect(pagina.formularioDestino.dirty).toBe(true);
    expect(pagina.revisado()).toBe(false);
    pagina.confirmarImportacao();
    http.expectNone('/api/v1/importacoes-financeiras/5/confirmar');
  });
  it('apresenta o snapshot aceito pelo servidor antes de habilitar a confirmação', () => {
    retomar();
    pagina.linhas.at(0).patchValue({
      decisao: 'CRIAR',
      descricao: 'Descrição submetida',
      justificativa: 'Conferido.',
    });
    pagina.salvarRevisao();
    http.expectOne('/api/v1/importacoes-financeiras/5/revisao').flush({
      ...revisao,
      importacao: {
        ...revisao.importacao,
        lancamentos: [{ ...linha, descricao: 'Descrição aceita' }],
      },
    });
    expect(pagina.linhas.at(0).controls.descricao.value).toBe('Descrição aceita');
    expect(pagina.revisado()).toBe(true);
  });
});
