import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { provideTranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { FocoAcessivelService } from '../../../../core/accessibility/foco-acessivel.service';
import { ReferenciasFinanceirasApiService } from '../../../../core/api/referencias-financeiras-api.service';
import { TransacoesApiService } from '../../data-access/transacoes-api.service';
import { FormularioTransacaoPage } from './formulario-transacao.page';

interface FormularioTransacaoParaTeste {
  readonly formulario: {
    markAsDirty(): void;
    controls: {
      tipo: { setValue(valor: 'ENTRADA' | 'SAIDA'): void };
      valor: { setValue(valor: string): void };
      data: { setValue(valor: string): void };
      descricao: { setValue(valor: string): void };
      contaId: { setValue(valor: number): void };
    };
  };
  salvar(): void;
  cancelar(): void;
  tentarCarregarReferencias(): void;
  erroReferencias(): string | null;
}

describe('FormularioTransacaoPage', () => {
  let component: FormularioTransacaoPage;
  let api: { criar: ReturnType<typeof vi.fn>; atualizar: ReturnType<typeof vi.fn> };
  let dialog: { open: ReturnType<typeof vi.fn> };
  let dialogRef: { close: ReturnType<typeof vi.fn> };
  let foco: { focarPorId: ReturnType<typeof vi.fn> };
  let referencias: { listar: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    api = { criar: vi.fn(), atualizar: vi.fn() };
    dialog = { open: vi.fn(() => ({ afterClosed: () => of(false) })) };
    dialogRef = { close: vi.fn() };
    foco = { focarPorId: vi.fn() };
    referencias = { listar: vi.fn(() => of([])) };

    TestBed.overrideComponent(FormularioTransacaoPage, {
      add: { providers: [{ provide: MatDialog, useValue: dialog }] },
    });

    await TestBed.configureTestingModule({
      imports: [FormularioTransacaoPage],
      providers: [
        provideTranslateService(),
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: TransacoesApiService, useValue: api },
        { provide: FocoAcessivelService, useValue: foco },
        { provide: ReferenciasFinanceirasApiService, useValue: referencias },
      ],
    }).compileComponents();

    const fixture: ComponentFixture<FormularioTransacaoPage> =
      TestBed.createComponent(FormularioTransacaoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('pede confirmação antes de descartar uma transação alterada', () => {
    formulario().formulario.controls.descricao.setValue('Alteração pendente');
    formulario().formulario.markAsDirty();

    formulario().cancelar();

    expect(dialog.open).toHaveBeenCalledOnce();
    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('foca o primeiro campo inválido ao tentar salvar', () => {
    formulario().salvar();

    expect(foco.focarPorId).toHaveBeenCalledWith('transacao-tipo');
    expect(api.criar).not.toHaveBeenCalled();
  });

  it('converte o valor textual e envia a transação válida', () => {
    api.criar.mockReturnValue(
      of({
        id: 1,
        tipo: 'SAIDA',
        valor: 42.5,
        data: '2026-08-20',
        descricao: 'Almoço',
        contaId: 2,
        categoriaId: null,
        meioPagamentoId: null,
        itens: [],
      }),
    );
    preencherFormulario();

    formulario().salvar();

    expect(api.criar).toHaveBeenCalledWith({
      tipo: 'SAIDA',
      valor: 42.5,
      data: '2026-08-20',
      descricao: 'Almoço',
      contaId: 2,
    });
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('mantém o formulário indisponível e permite tentar novamente quando referências falham', () => {
    referencias.listar.mockReturnValue(throwError(() => new Error('Falha de rede')));

    formulario().tentarCarregarReferencias();

    expect(formulario().erroReferencias()).toBe('TRANSACOES.MENSAGENS.ERRO_SALVAR');
    expect(referencias.listar).toHaveBeenCalledTimes(6);
  });

  function formulario(): FormularioTransacaoParaTeste {
    return component as unknown as FormularioTransacaoParaTeste;
  }

  function preencherFormulario(): void {
    formulario().formulario.controls.tipo.setValue('SAIDA');
    formulario().formulario.controls.valor.setValue('42,50');
    formulario().formulario.controls.data.setValue('2026-08-20');
    formulario().formulario.controls.descricao.setValue('Almoço');
    formulario().formulario.controls.contaId.setValue(2);
  }
});
