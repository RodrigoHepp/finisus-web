import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { URL_BASE_API } from '../../infraestrutura/api/configuracao-api';
import { ContasPage } from './contas.page';
import { CadastrosPage } from './cadastros.page';
import { TransacoesPage } from './transacoes.page';

const vazio = { conteudo: [], pagina: 0, tamanho: 20, totalElementos: 0, totalPaginas: 0 };
const conta = {
  id: 1,
  nome: 'Espécie',
  tipo: 'FISICO' as const,
  bancoId: null,
  ativo: true,
  saldo: 0,
};
describe('Edições posteriores ao envio diário', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: URL_BASE_API, useValue: '/api/v1' },
        { provide: MatDialog, useValue: { open: () => ({ afterClosed: () => of(true) }) } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  function esgotarListas() {
    http.match((r) => r.method === 'GET').forEach((r) => r.flush(vazio));
  }
  it('mantém a conta em edição e usa PATCH ao salvar a alteração posterior', () => {
    const pagina = TestBed.runInInjectionContext(() => new ContasPage());
    esgotarListas();
    pagina.novaConta();
    pagina.formulario.setValue({ nome: 'Espécie', tipo: 'FISICO', bancoId: null });
    pagina.salvar();
    const pendencias = http.expectOne((r) => r.method === 'POST');
    pagina.formulario.controls.nome.setValue('Novo nome');
    pagina.formulario.markAsDirty();
    pendencias.flush(conta);
    esgotarListas();
    expect(pagina.editando()).toBe(true);
    expect(pagina.formulario.dirty).toBe(true);
    expect(pagina.formulario.controls.nome.value).toBe('Novo nome');
    pagina.salvar();
    const atualizar = http.expectOne('/api/v1/contas/1');
    expect(atualizar.request.method).toBe('PATCH');
    atualizar.flush({ ...conta, nome: 'Novo nome' });
    esgotarListas();
    expect(pagina.editando()).toBe(false);
  });
  it('preserva um ajuste alterado antes da confirmação HTTP', () => {
    const pagina = TestBed.runInInjectionContext(() => new ContasPage());
    esgotarListas();
    pagina.selecionado.set(conta);
    pagina.formularioAjuste.setValue({ saldoInformado: 100, motivo: 'Conferência' });
    pagina.ajustar();
    const pendencias = http.expectOne('/api/v1/contas/1/ajustes-saldo');
    pagina.formularioAjuste.controls.motivo.setValue('Nova conferência');
    pagina.formularioAjuste.markAsDirty();
    pendencias.flush({ id: 2 });
    esgotarListas();
    expect(pagina.formularioAjuste.controls.motivo.value).toBe('Nova conferência');
    expect(pagina.temAlteracoes()).toBe(true);
  });
  it('preserva a próxima transferência preenchida enquanto a anterior é enviada', () => {
    const pagina = TestBed.runInInjectionContext(() => new ContasPage());
    esgotarListas();
    pagina.formularioTransferencia.setValue({
      contaOrigemId: 1,
      contaDestinoId: 2,
      valor: 10,
      data: '2026-10-08',
      descricao: 'Anterior',
    });
    pagina.transferir();
    const pendencias = http.expectOne('/api/v1/transferencias');
    pagina.formularioTransferencia.controls.valor.setValue(20);
    pagina.formularioTransferencia.markAsDirty();
    pendencias.flush({ id: 3 });
    esgotarListas();
    expect(pagina.formularioTransferencia.controls.valor.value).toBe(20);
    expect(pagina.formularioTransferencia.dirty).toBe(true);
  });
  it('mantém alterações de catálogo e identifica o cadastro criado', () => {
    const pagina = TestBed.runInInjectionContext(() => new CadastrosPage());
    esgotarListas();
    pagina.novoCadastro();
    pagina.formulario.setValue({ nome: 'Banco', codigo: '001', referencia: null });
    pagina.salvar();
    const pendencias = http.expectOne((r) => r.method === 'POST');
    pagina.formulario.controls.nome.setValue('Outro nome');
    pagina.formulario.markAsDirty();
    pendencias.flush({ id: 4, nome: 'Banco', codigo: '001', ativo: true });
    esgotarListas();
    expect(pagina.idEdicao()).toBe(4);
    expect(pagina.editando()).toBe(true);
    expect(pagina.formulario.dirty).toBe(true);
  });
  it('preserva novas alterações e exige motivo de correção da transação já criada', () => {
    const pagina = TestBed.runInInjectionContext(() => new TransacoesPage());
    esgotarListas();
    pagina.novaTransacao();
    pagina.formulario.patchValue({
      contaId: 1,
      valor: 10,
      data: '2026-10-08',
      descricao: 'Anterior',
    });
    pagina.salvar();
    const pendencias = http.expectOne((r) => r.method === 'POST');
    pagina.formulario.controls.descricao.setValue('Posterior');
    pagina.formulario.markAsDirty();
    pendencias.flush({ id: 5 });
    esgotarListas();
    expect(pagina.formulario.controls.descricao.value).toBe('Posterior');
    expect(pagina.editando()).toBe('correcao');
    expect(pagina.idEdicao()).toBe(5);
    expect(pagina.formulario.dirty).toBe(true);
    expect(pagina.formulario.controls.motivo.invalid).toBe(true);
  });
});
