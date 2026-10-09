import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { of } from 'rxjs';
import { URL_BASE_API } from '../../infraestrutura/api/configuracao-api';
import { InvestimentosPage } from './investimentos.page';
const investimento = {
  id: 1,
  nome: 'Reserva',
  tipo: 'RENDA_FIXA' as const,
  contaOrigemId: 2,
  contaCustodiaId: null,
  ativo: true,
};
const vazio = { conteudo: [], pagina: 0, tamanho: 20, totalElementos: 0, totalPaginas: 0 };
describe('Coordenação de investimentos', () => {
  let pagina: InvestimentosPage;
  let http: HttpTestingController;
  let aceito: boolean;
  beforeEach(() => {
    aceito = true;
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: URL_BASE_API, useValue: '/api/v1' },
        { provide: MatDialog, useValue: { open: () => ({ afterClosed: () => of(aceito) }) } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    pagina = TestBed.runInInjectionContext(() => new InvestimentosPage());
    http.expectOne((r) => r.url === '/api/v1/investimentos').flush(vazio);
    http.expectOne((r) => r.url === '/api/v1/contas').flush(vazio);
  });
  afterEach(() => http.verify());
  it('preserva a edição posterior e identifica o investimento criado', () => {
    pagina.criar();
    pagina.formulario.setValue({
      nome: 'Reserva',
      tipo: 'RENDA_FIXA',
      contaOrigemId: 2,
      contaCustodiaId: null,
    });
    pagina.salvar();
    const pendencias = http.expectOne((r) => r.method === 'POST');
    pagina.formulario.controls.nome.setValue('Nova reserva');
    pagina.formulario.markAsDirty();
    pendencias.flush(investimento);
    http.expectOne((r) => r.url === '/api/v1/investimentos').flush(vazio);
    http.expectOne('/api/v1/investimentos/1').flush(investimento);
    http.expectOne((r) => r.url.endsWith('/1/movimentos')).flush(vazio);
    http.expectOne((r) => r.url.endsWith('/1/posicoes')).flush(vazio);
    expect(pagina.formulario.controls.nome.value).toBe('Nova reserva');
    expect(pagina.formulario.dirty).toBe(true);
    expect(pagina.mostrarFormulario()).toBe(true);
    expect(pagina.editando()).toBe(1);
  });
  it('preserva o próximo movimento alterado durante o envio', () => {
    pagina.selecionado.set(investimento);
    pagina.formularioMovimento.controls.valor.setValue(50);
    pagina.registrarMovimento();
    const pendencias = http.expectOne('/api/v1/investimentos/movimentos');
    pagina.formularioMovimento.controls.valor.setValue(70);
    pagina.formularioMovimento.markAsDirty();
    pendencias.flush({ id: 2 });
    http.expectOne((r) => r.url.endsWith('/1/movimentos')).flush(vazio);
    expect(pagina.formularioMovimento.controls.valor.value).toBe(70);
    expect(pagina.formularioMovimento.dirty).toBe(true);
  });
  it('não marca uma posição posterior como persistida', () => {
    pagina.selecionado.set(investimento);
    pagina.formularioPosicao.controls.valor.setValue(50);
    pagina.registrarPosicao();
    const pendencias = http.expectOne('/api/v1/investimentos/1/posicoes');
    pagina.formularioPosicao.controls.valor.setValue(70);
    pagina.formularioPosicao.markAsDirty();
    pendencias.flush({ id: 2 });
    http.expectOne((r) => r.url.endsWith('/1/posicoes')).flush(vazio);
    expect(pagina.formularioPosicao.controls.valor.value).toBe(70);
    expect(pagina.formularioPosicao.dirty).toBe(true);
  });
  it('mantém edição quando o descarte de um novo cadastro é recusado', () => {
    pagina.criar();
    pagina.formulario.controls.nome.setValue('Não perder');
    pagina.formulario.markAsDirty();
    aceito = false;
    pagina.criar();
    expect(pagina.formulario.controls.nome.value).toBe('Não perder');
    expect(pagina.formulario.dirty).toBe(true);
    pagina.editar(investimento);
    expect(pagina.formulario.controls.nome.value).toBe('Não perder');
  });
  it('mantém o investimento e o movimento quando a troca é recusada', () => {
    pagina.selecionado.set(investimento);
    pagina.formularioMovimento.controls.valor.setValue(42.12);
    pagina.formularioMovimento.markAsDirty();
    aceito = false;
    pagina.selecionar(2);
    http.expectNone('/api/v1/investimentos/2');
    expect(pagina.selecionado()?.id).toBe(1);
    expect(pagina.formularioMovimento.controls.valor.value).toBe(42.12);
  });
  it('não deixa uma página antiga substituir a consulta recente', () => {
    pagina.carregar({ pageIndex: 1, pageSize: 20 } as PageEvent);
    const estadoMaisAntigo = http.expectOne((r) => r.url === '/api/v1/investimentos');
    pagina.carregar({ pageIndex: 2, pageSize: 20 } as PageEvent);
    const estadoMaisRecente = http.expectOne((r) => r.url === '/api/v1/investimentos');
    estadoMaisRecente.flush({ ...vazio, pagina: 2 });
    estadoMaisAntigo.flush({ ...vazio, pagina: 1 });
    expect(pagina.listar()?.pagina).toBe(2);
  });
  it('protege a paginação de movimentos do mesmo investimento', () => {
    pagina.selecionado.set(investimento);
    pagina.carregarMovimentos({ pageIndex: 1, pageSize: 20 } as PageEvent);
    const estadoMaisAntigo = http.expectOne((r) => r.url.endsWith('/1/movimentos'));
    pagina.carregarMovimentos({ pageIndex: 2, pageSize: 20 } as PageEvent);
    const estadoMaisRecente = http.expectOne((r) => r.url.endsWith('/1/movimentos'));
    estadoMaisRecente.flush({ ...vazio, pagina: 2 });
    estadoMaisAntigo.flush({ ...vazio, pagina: 1 });
    expect(pagina.movimentos()?.pagina).toBe(2);
  });
  it('consulta o cadastro salvo sem bloqueá-lo pelo estado da própria mutação', () => {
    pagina.criar();
    pagina.formulario.setValue({
      nome: 'Reserva',
      tipo: 'RENDA_FIXA',
      contaOrigemId: 2,
      contaCustodiaId: null,
    });
    pagina.salvar();
    http
      .expectOne((r) => r.method === 'POST' && r.url === '/api/v1/investimentos')
      .flush(investimento);
    http
      .expectOne((r) => r.url === '/api/v1/investimentos')
      .flush({ ...vazio, conteudo: [investimento] });
    http.expectOne('/api/v1/investimentos/1').flush(investimento);
    http.expectOne((r) => r.url.endsWith('/1/movimentos')).flush(vazio);
    http.expectOne((r) => r.url.endsWith('/1/posicoes')).flush(vazio);
    expect(pagina.selecionado()?.id).toBe(1);
    expect(pagina.formulario.pristine).toBe(true);
  });
});
