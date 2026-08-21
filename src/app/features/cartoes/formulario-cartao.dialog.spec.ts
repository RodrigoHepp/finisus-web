import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { FocoAcessivelService } from '../../core/accessibility/foco-acessivel.service';
import { MensagemGlobalService } from '../../core/feedback/mensagem-global.service';
import { CartoesApiService } from './cartoes-api.service';
import { FormularioCartaoDialogComponent } from './formulario-cartao.dialog';

interface FormularioCartaoParaTeste {
  readonly formulario: {
    controls: {
      nome: { setValue(valor: string): void };
      limite: { setValue(valor: string): void };
      diaFechamento: { setValue(valor: number): void };
      diaVencimento: { setValue(valor: number): void };
    };
  };
  salvar(): void;
}

describe('FormularioCartaoDialogComponent', () => {
  let component: FormularioCartaoDialogComponent;
  let api: { criar: ReturnType<typeof vi.fn>; atualizar: ReturnType<typeof vi.fn> };
  let foco: { focarPorId: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    api = { criar: vi.fn(), atualizar: vi.fn() };
    foco = { focarPorId: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [FormularioCartaoDialogComponent],
      providers: [
        provideTranslateService(),
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
        { provide: MatDialog, useValue: { open: vi.fn(() => ({ afterClosed: () => of(false) })) } },
        { provide: CartoesApiService, useValue: api },
        { provide: FocoAcessivelService, useValue: foco },
        { provide: MensagemGlobalService, useValue: { sucesso: vi.fn() } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(FormularioCartaoDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('foca o limite ao tentar enviar um valor decimal inválido', () => {
    preencherFormulario({ limite: '0' });

    formulario().salvar();

    expect(api.criar).not.toHaveBeenCalled();
    expect(foco.focarPorId).toHaveBeenCalledWith('cartao-limite');
  });

  it('converte o limite textual apenas no envio', () => {
    api.criar.mockReturnValue(
      of({
        id: 1,
        nome: 'Visa',
        limite: 1500.5,
        diaFechamento: 10,
        diaVencimento: 17,
        ativo: true,
      }),
    );
    preencherFormulario({ limite: '1500,50' });

    formulario().salvar();

    expect(api.criar).toHaveBeenCalledWith({
      nome: 'Visa',
      limite: 1500.5,
      diaFechamento: 10,
      diaVencimento: 17,
    });
  });

  function formulario(): FormularioCartaoParaTeste {
    return component as unknown as FormularioCartaoParaTeste;
  }

  function preencherFormulario(sobrescritas: Partial<{ limite: string }> = {}): void {
    formulario().formulario.controls.nome.setValue('Visa');
    formulario().formulario.controls.limite.setValue('1000,00');
    formulario().formulario.controls.diaFechamento.setValue(10);
    formulario().formulario.controls.diaVencimento.setValue(17);

    if (sobrescritas.limite !== undefined) {
      formulario().formulario.controls.limite.setValue(sobrescritas.limite);
    }
  }
});
